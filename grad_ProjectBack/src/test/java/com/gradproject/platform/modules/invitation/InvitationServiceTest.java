package com.gradproject.platform.modules.invitation;

import com.gradproject.platform.exception.InvitationConflictException;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.team.TeamRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock
    private InvitationRepository invitationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private NotificationService notificationService;

    private InvitationService invitationService;
    private User sender;
    private User receiver;
    private Team senderTeam;

    @BeforeEach
    void setUp() {
        invitationService = new InvitationService(invitationRepository, userRepository, teamRepository, teamMemberRepository, notificationService);
        sender = student(UUID.randomUUID(), "leader@example.com");
        receiver = student(UUID.randomUUID(), "receiver@example.com");
        senderTeam = team(UUID.randomUUID(), sender);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(sender, null, sender.getAuthorities()));
        lenient().when(teamRepository.findByLeaderId(sender.getId())).thenReturn(senderTeam);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void cannotInviteYourself() {
        assertThatThrownBy(() -> invitationService.sendInvitation(sender.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("You cannot invite yourself.");

        verify(invitationRepository, never()).save(any());
    }

    @Test
    void cannotInviteStudentAlreadyInTeam() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamMemberRepository.existsByUserId(receiver.getId())).thenReturn(true);

        assertThatThrownBy(() -> invitationService.sendInvitation(receiver.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("Student is already in a team.");

        verify(invitationRepository, never()).save(any());
    }

    @Test
    void cannotInviteStudentWithPendingInvitation() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.existsByReceiverIdAndStatus(receiver.getId(), InvitationStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> invitationService.sendInvitation(receiver.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("Student already has a pending invitation.");

        verify(invitationRepository, never()).save(any());
    }

    @Test
    void cannotInviteStudentWithPendingInvitationFromSameTeamWithSpecificMessage() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.existsByReceiverIdAndTeamIdAndStatus(receiver.getId(), senderTeam.getId(), InvitationStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> invitationService.sendInvitation(receiver.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("You already sent an invitation to this student.");

        verify(invitationRepository, never()).save(any());
    }

    @Test
    void canInviteStudentWithOldRejectedInvitation() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invitation invitation = invitationService.sendInvitation(receiver.getId());

        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.PENDING);
        assertThat(invitation.getReceiver()).isEqualTo(receiver);
        verify(invitationRepository).existsByReceiverIdAndTeamIdAndStatus(receiver.getId(), senderTeam.getId(), InvitationStatus.PENDING);
        verify(invitationRepository).existsByReceiverIdAndStatus(receiver.getId(), InvitationStatus.PENDING);
        verify(notificationService).createNotification(eq(receiver), any(), any(), eq(NotificationType.TEAM_INVITATION), eq("/invitations"));
    }

    @Test
    void canInviteStudentWithOldAcceptedInvitationOnlyIfNoLongerInTeam() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamMemberRepository.existsByUserId(receiver.getId())).thenReturn(false);
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invitation invitation = invitationService.sendInvitation(receiver.getId());

        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.PENDING);
        assertThat(invitation.getTeam()).isEqualTo(senderTeam);
        ArgumentCaptor<Invitation> captor = ArgumentCaptor.forClass(Invitation.class);
        verify(invitationRepository).save(captor.capture());
        assertThat(captor.getValue().getReceiver()).isEqualTo(receiver);
    }

    @Test
    void onlyTeamLeaderCanSendInvitations() {
        when(teamRepository.findByLeaderId(sender.getId())).thenReturn(null);
        when(teamMemberRepository.findByUserId(sender.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invitationService.sendInvitation(receiver.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("Create a team before inviting students.");

        verify(invitationRepository, never()).save(any());
    }

    @Test
    void teamMemberCannotSendInvitations() {
        when(teamRepository.findByLeaderId(sender.getId())).thenReturn(null);
        when(teamMemberRepository.findByUserId(sender.getId())).thenReturn(Optional.of(TeamMember.builder()
                .team(senderTeam)
                .user(sender)
                .memberRole("MEMBER")
                .membershipStatus("ACTIVE")
                .build()));

        assertThatThrownBy(() -> invitationService.sendInvitation(receiver.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("Only team leader can send invitations.");

        verify(invitationRepository, never()).save(any());
    }

    @Test
    void leaderCanCancelPendingInvitationFromHisTeam() {
        Invitation invitation = invitation(InvitationStatus.PENDING, sender, receiver, senderTeam);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = invitationService.cancelInvitation(invitation.getId());

        assertThat(response.status()).isEqualTo("CANCELED");
        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.CANCELED);
    }

    @Test
    void nonLeaderCannotCancelInvitation() {
        when(teamRepository.findByLeaderId(sender.getId())).thenReturn(null);

        assertThatThrownBy(() -> invitationService.cancelInvitation(UUID.randomUUID()))
                .hasMessage("Only team leader can cancel invitations.");
    }

    @Test
    void cannotCancelAcceptedInvitation() {
        Invitation invitation = invitation(InvitationStatus.ACCEPTED, sender, receiver, senderTeam);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));

        assertThatThrownBy(() -> invitationService.cancelInvitation(invitation.getId()))
                .isInstanceOf(InvitationConflictException.class)
                .hasMessage("Only pending invitations can be canceled.");
    }

    @Test
    void canceledInvitationDoesNotBlockFutureInvite() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invitation invitation = invitationService.sendInvitation(receiver.getId());

        assertThat(invitation.getStatus()).isEqualTo(InvitationStatus.PENDING);
        verify(invitationRepository).existsByReceiverIdAndTeamIdAndStatus(receiver.getId(), senderTeam.getId(), InvitationStatus.PENDING);
        verify(invitationRepository).existsByReceiverIdAndStatus(receiver.getId(), InvitationStatus.PENDING);
    }

    @Test
    void leaderGetsNotificationWhenInvitationAccepted() {
        Invitation invitation = invitation(InvitationStatus.PENDING, sender, receiver, senderTeam);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(teamMemberRepository.existsByUserId(receiver.getId())).thenReturn(false);
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(receiver, null, receiver.getAuthorities()));

        invitationService.acceptInvitation(invitation.getId());

        verify(notificationService).createNotification(eq(sender), any(), any(), eq(NotificationType.INVITATION_ACCEPTED), eq("/my-team"));
    }

    @Test
    void onlyPendingInvitationBlocksEligibility() {
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(teamRepository.findByLeaderId(receiver.getId())).thenReturn(null);
        when(invitationRepository.existsByReceiverIdAndStatus(receiver.getId(), InvitationStatus.PENDING)).thenReturn(true);

        var eligibility = invitationService.getInviteEligibility(receiver.getId(), sender);

        assertThat(eligibility.isEligible()).isFalse();
        assertThat(eligibility.getReason()).isEqualTo("Student already has a pending invitation.");
    }

    private static User student(UUID id, String email) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(UserRole.ROLE_STUDENT);
        return user;
    }

    private static Team team(UUID id, User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", id);
        team.setName("Team A");
        team.setMaxSize(5);
        team.setLeader(leader);
        return team;
    }

    private static Invitation invitation(InvitationStatus status, User sender, User receiver, Team team) {
        Invitation invitation = new Invitation();
        ReflectionTestUtils.setField(invitation, "id", UUID.randomUUID());
        invitation.setSender(sender);
        invitation.setReceiver(receiver);
        invitation.setTeam(team);
        invitation.setStatus(status);
        return invitation;
    }
}
