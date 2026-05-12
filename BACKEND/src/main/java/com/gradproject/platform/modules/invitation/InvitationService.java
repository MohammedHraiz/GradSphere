package com.gradproject.platform.modules.invitation;

import com.gradproject.platform.exception.InvitationAccessDeniedException;
import com.gradproject.platform.exception.InvitationConflictException;
import com.gradproject.platform.exception.InvitationNotFoundException;
import com.gradproject.platform.modules.invitation.dto.InviteEligibility;
import com.gradproject.platform.modules.invitation.dto.InvitationActionResponseDTO;
import com.gradproject.platform.modules.invitation.dto.InvitationResponseDTO;
import com.gradproject.platform.modules.invitation.dto.SentInvitationResponseDTO;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.team.TeamRepository;
import com.gradproject.platform.modules.team.TeamRules;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;

    public InvitationService(
            InvitationRepository invitationRepository,
            UserRepository userRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            NotificationService notificationService) {
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Invitation sendInvitation(UUID receiverId) {
        User sender = getCurrentUser();

        if (sender == null) {
            throw new InvitationAccessDeniedException("Sender not found");
        }

        InviteEligibility eligibility = getInviteEligibility(receiverId, sender);
        if (!eligibility.isEligible()) {
            throw new InvitationConflictException(eligibility.getReason());
        }

        Invitation invitation = new Invitation();
        invitation.setSender(sender);
        invitation.setReceiver(eligibility.getReceiver());
        invitation.setTeam(eligibility.getTeam());
        invitation.setStatus(InvitationStatus.PENDING);

        Invitation savedInvitation = invitationRepository.save(invitation);
        notificationService.createNotification(
                savedInvitation.getReceiver(),
                "New team invitation",
                sender.getName() + " invited you to join team \"" + savedInvitation.getTeam().getName() + "\".",
                NotificationType.TEAM_INVITATION,
                "/invitations"
        );
        return savedInvitation;
    }

    @Transactional(readOnly = true)
    public InviteEligibility getInviteEligibility(UUID receiverId, User currentUser) {
        if (currentUser == null) {
            return InviteEligibility.ineligible("Sender not found", null, null);
        }

        Team senderTeam = teamRepository.findByLeaderId(currentUser.getId());
        if (senderTeam == null) {
            TeamMember senderMembership = teamMemberRepository.findByUserId(currentUser.getId()).orElse(null);
            if (senderMembership != null) {
                return InviteEligibility.ineligible("Only team leader can send invitations.", null, senderMembership.getTeam());
            }
            return InviteEligibility.ineligible("Create a team before inviting students.", null, null);
        }

        if (receiverId == null) {
            return InviteEligibility.ineligible("Receiver not found", null, senderTeam);
        }

        if (isTeamFull(senderTeam)) {
            return InviteEligibility.ineligible(TeamRules.TEAM_FULL_MESSAGE, null, senderTeam);
        }

        if (currentUser.getId().equals(receiverId)) {
            return InviteEligibility.ineligible("You cannot invite yourself.", currentUser, senderTeam);
        }

        User receiver = userRepository.findById(receiverId).orElse(null);
        if (receiver == null) {
            return InviteEligibility.ineligible("Receiver not found", null, senderTeam);
        }

        if (receiver.getRole() != UserRole.ROLE_STUDENT) {
            return InviteEligibility.ineligible("Only students can be invited to a team.", receiver, senderTeam);
        }

        if (teamMemberRepository.existsByUserId(receiverId) || teamRepository.findByLeaderId(receiverId) != null) {
            return InviteEligibility.ineligible("Student is already in a team.", receiver, senderTeam);
        }

        if (invitationRepository.existsByReceiverIdAndTeamIdAndStatus(receiverId, senderTeam.getId(), InvitationStatus.PENDING)) {
            return InviteEligibility.ineligible("You already sent an invitation to this student.", receiver, senderTeam);
        }

        if (invitationRepository.existsByReceiverIdAndStatus(receiverId, InvitationStatus.PENDING)) {
            return InviteEligibility.ineligible("Student already has a pending invitation.", receiver, senderTeam);
        }

        return InviteEligibility.eligible(receiver, senderTeam);
    }

    @Transactional
    public InvitationActionResponseDTO acceptInvitation(UUID invitationId) {
        User currentUser = getCurrentUser();
        Invitation invitation = getOwnedPendingInvitation(invitationId, currentUser);

        if (isUserAlreadyInAnyTeam(currentUser.getId())) {
            throw new InvitationConflictException("User already belongs to a team");
        }

        Team invitationTeam = invitation.getTeam();
        if (invitationTeam == null || invitationTeam.getId() == null) {
            throw new InvitationConflictException("Invitation team is no longer available.");
        }

        if (isTeamFull(invitationTeam)) {
            throw new InvitationConflictException(TeamRules.TEAM_FULL_MESSAGE);
        }

        TeamMember teamMember = TeamMember.builder()
                .team(invitationTeam)
                .user(currentUser)
                .memberRole("MEMBER")
                .membershipStatus("ACTIVE")
                .joinedAt(Instant.now())
                .build();

        teamMemberRepository.save(teamMember);
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
        if (invitation.getSender() != null) {
            notificationService.createNotification(
                    invitation.getSender(),
                    "Invitation accepted",
                    currentUser.getName() + " accepted your invitation to join team \"" + invitation.getTeam().getName() + "\".",
                    NotificationType.INVITATION_ACCEPTED,
                    "/my-team"
            );
        }
        return new InvitationActionResponseDTO("ACCEPTED", "Invitation accepted", invitation.getId(), invitationTeam.getId());
    }

    @Transactional
    public InvitationActionResponseDTO rejectInvitation(UUID invitationId) {
        User currentUser = getCurrentUser();
        Invitation invitation = getOwnedPendingInvitation(invitationId, currentUser);
        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
        if (invitation.getSender() != null) {
            notificationService.createNotification(
                    invitation.getSender(),
                    "Invitation rejected",
                    currentUser.getName() + " rejected your invitation to join team \"" + invitation.getTeam().getName() + "\".",
                    NotificationType.INVITATION_REJECTED,
                    "/my-team"
            );
        }
        return new InvitationActionResponseDTO("REJECTED", "Invitation rejected", invitation.getId(), invitation.getTeam().getId());
    }

    @Transactional(readOnly = true)
    public List<SentInvitationResponseDTO> getPendingSentInvitationsForCurrentTeam() {
        User currentUser = getCurrentUser();
        Team team = getLeaderTeamOrThrow(currentUser, "Only team leader can view sent invitations.");

        return invitationRepository.findByTeamIdAndStatusOrderByCreatedAtDesc(team.getId(), InvitationStatus.PENDING)
                .stream()
                .map(invitation -> new SentInvitationResponseDTO(
                        invitation.getId(),
                        invitation.getReceiver() != null ? invitation.getReceiver().getId() : null,
                        invitation.getReceiver() != null ? invitation.getReceiver().getName() : null,
                        invitation.getReceiver() != null ? invitation.getReceiver().getEmail() : null,
                        invitation.getReceiver() != null ? invitation.getReceiver().getUniversityId() : null,
                        invitation.getTeam() != null ? invitation.getTeam().getName() : null,
                        invitation.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public InvitationActionResponseDTO cancelInvitation(UUID invitationId) {
        User currentUser = getCurrentUser();
        Team team = getLeaderTeamOrThrow(currentUser, "Only team leader can cancel invitations.");

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found."));

        if (invitation.getTeam() == null || invitation.getTeam().getId() == null || !invitation.getTeam().getId().equals(team.getId())) {
            throw new InvitationAccessDeniedException("You can only cancel invitations sent by your team.");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new InvitationConflictException("Only pending invitations can be canceled.");
        }

        invitation.setStatus(InvitationStatus.CANCELED);
        invitationRepository.save(invitation);
        return new InvitationActionResponseDTO("CANCELED", "Invitation canceled", invitation.getId(), team.getId());
    }

    @Transactional(readOnly = true)
    public List<InvitationResponseDTO> getPendingInvitationsForCurrentUser() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new InvitationAccessDeniedException("Current user not found");
        }

        return invitationRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), InvitationStatus.PENDING)
                .stream()
                .map(invitation -> new InvitationResponseDTO(
                        invitation.getId(),
                        invitation.getTeam() != null ? invitation.getTeam().getName() : null,
                        invitation.getSender() != null ? invitation.getSender().getName() : null,
                        invitation.getSender() != null ? invitation.getSender().getUniversityId() : null,
                        invitation.getCreatedAt()
                ))
                .toList();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private Invitation getOwnedPendingInvitation(UUID invitationId, User currentUser) {
        if (currentUser == null) {
            throw new InvitationAccessDeniedException("Current user not found");
        }

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found"));

        if (invitation.getReceiver() == null || invitation.getReceiver().getId() == null || !invitation.getReceiver().getId().equals(currentUser.getId())) {
            throw new InvitationAccessDeniedException("You are not allowed to modify this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new InvitationConflictException("Invitation is not pending");
        }

        return invitation;
    }

    private boolean isUserAlreadyInAnyTeam(UUID userId) {
        boolean isMember = teamMemberRepository.existsByUserId(userId);
        boolean isLeader = teamRepository.findByLeaderId(userId) != null;
        return isMember || isLeader;
    }

    private boolean isTeamFull(Team team) {
        return team != null
                && team.getId() != null
                && teamMemberRepository.countByTeamId(team.getId()) >= TeamRules.MAX_MEMBERS;
    }

    private Team getLeaderTeamOrThrow(User currentUser, String leaderMessage) {
        if (currentUser == null) {
            throw new InvitationAccessDeniedException("Current user not found");
        }

        Team team = teamRepository.findByLeaderId(currentUser.getId());
        if (team == null) {
            throw new InvitationAccessDeniedException(leaderMessage);
        }

        return team;
    }
}


