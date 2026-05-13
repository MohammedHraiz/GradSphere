package com.gradproject.platform.modules.team;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.invitation.InvitationRepository;
import com.gradproject.platform.modules.invitation.InvitationStatus;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.task.TaskStatus;
import com.gradproject.platform.modules.team.dto.CreateTeamRequest;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private InvitationRepository invitationRepository;

    @Mock
    private SupervisorRequestRepository supervisorRequestRepository;

    private TeamService teamService;
    private User leader;
    private User member;
    private Team team;
    private TeamMember memberMembership;

    @BeforeEach
    void setUp() {
        teamService = new TeamService(
                userRepository,
                teamRepository,
                teamMemberRepository,
                projectRepository,
                taskRepository,
                invitationRepository,
                supervisorRequestRepository
        );
        leader = user(UUID.randomUUID(), "leader@example.com");
        member = user(UUID.randomUUID(), "member@example.com");
        team = team(UUID.randomUUID(), leader);
        memberMembership = membership(team, member, "MEMBER");
    }

    @Test
    void createTeamDefaultsMaxMembersToFive() {
        UUID newTeamId = UUID.randomUUID();
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.existsByUserId(leader.getId())).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenAnswer(invocation -> {
            Team saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", newTeamId);
            return saved;
        });
        when(teamMemberRepository.countByTeamId(newTeamId)).thenReturn(1L);
        when(teamMemberRepository.findAllByTeamId(newTeamId)).thenReturn(List.of(membership(team(newTeamId, leader), leader, "LEADER")));
        when(projectRepository.findByTeamId(newTeamId)).thenReturn(Optional.empty());

        var response = teamService.createTeam(leader.getEmail(), new CreateTeamRequest("Research Team", "AI / Machine Learning", null));

        assertThat(response.maxMembers()).isEqualTo(5);
        assertThat(response.membersCount()).isEqualTo(1);
        assertThat(response.projectDomain()).isEqualTo("AI / Machine Learning");
        assertThat(response.totalTasks()).isZero();
        assertThat(response.completionRate()).isZero();
    }

    @Test
    void createTeamRejectsMaxMembersAboveFive() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.existsByUserId(leader.getId())).thenReturn(false);

        assertThatThrownBy(() -> teamService.createTeam(leader.getEmail(), new CreateTeamRequest("Research Team", "Web", 6)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Team maximum size is 5 members.");

        verify(teamRepository, never()).save(any());
    }

    @Test
    void teamWithNoProjectReturnsZeroTaskStats() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.empty());
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(leaderMembership));

        var response = teamService.getMyTeam(leader.getEmail()).orElseThrow();

        assertThat(response.totalTasks()).isZero();
        assertThat(response.completedTasks()).isZero();
        assertThat(response.completionRate()).isZero();
    }

    @Test
    void teamWithTasksReturnsCorrectTaskStats() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTeam(team);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(3L);
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(taskRepository.countByProjectId(project.getId())).thenReturn(8L);
        when(taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.COMPLETED)).thenReturn(5L);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(leaderMembership, memberMembership));

        var response = teamService.getMyTeam(leader.getEmail()).orElseThrow();

        assertThat(response.totalTasks()).isEqualTo(8);
        assertThat(response.completedTasks()).isEqualTo(5);
        assertThat(response.completionRate()).isEqualTo(62);
        verify(taskRepository).countByProjectIdAndStatus(project.getId(), TaskStatus.COMPLETED);
    }

    @Test
    void leaderCanRemoveNormalMember() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamRepository.findByLeaderId(leader.getId())).thenReturn(team);
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), member.getId())).thenReturn(Optional.of(memberMembership));
        when(projectRepository.existsByStudentIdAndStatusNot(member.getId(), ProjectStatus.ARCHIVED)).thenReturn(false);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(membership(team, leader, "LEADER")));

        var updatedMembers = teamService.removeMemberFromMyTeam(leader.getEmail(), member.getId());

        verify(teamMemberRepository).delete(memberMembership);
        verify(userRepository, never()).delete(member);
        assertThat(updatedMembers).hasSize(1);
        assertThat(updatedMembers.get(0).userId()).isEqualTo(leader.getId());
    }

    @Test
    void nonLeaderCannotRemoveMember() {
        when(userRepository.findByEmail(member.getEmail())).thenReturn(Optional.of(member));
        when(teamRepository.findByLeaderId(member.getId())).thenReturn(null);

        assertThatThrownBy(() -> teamService.removeMemberFromMyTeam(member.getEmail(), leader.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only team leader can remove members.");
    }

    @Test
    void leaderCannotRemoveHimself() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamRepository.findByLeaderId(leader.getId())).thenReturn(team);

        assertThatThrownBy(() -> teamService.removeMemberFromMyTeam(leader.getEmail(), leader.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You cannot remove yourself.");
    }

    @Test
    void cannotRemoveUserFromAnotherTeam() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamRepository.findByLeaderId(leader.getId())).thenReturn(team);
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), member.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.removeMemberFromMyTeam(leader.getEmail(), member.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("User is not a member of your team.");
    }

    @Test
    void removedUserBecomesEligibleForInvitationAgain() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamRepository.findByLeaderId(leader.getId())).thenReturn(team);
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), member.getId())).thenReturn(Optional.of(memberMembership));
        when(projectRepository.existsByStudentIdAndStatusNot(member.getId(), ProjectStatus.ARCHIVED)).thenReturn(false);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(membership(team, leader, "LEADER")));

        teamService.removeMemberFromMyTeam(leader.getEmail(), member.getId());

        verify(teamMemberRepository).delete(memberMembership);
    }

    @Test
    void removingMemberDoesNotDeleteUserAccount() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamRepository.findByLeaderId(leader.getId())).thenReturn(team);
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), member.getId())).thenReturn(Optional.of(memberMembership));
        when(projectRepository.existsByStudentIdAndStatusNot(member.getId(), ProjectStatus.ARCHIVED)).thenReturn(false);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(membership(team, leader, "LEADER")));

        teamService.removeMemberFromMyTeam(leader.getEmail(), member.getId());

        verify(userRepository, never()).deleteById(member.getId());
        verify(userRepository, never()).delete(member);
    }

    @Test
    void cannotRemoveMemberLinkedToActiveProject() {
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamRepository.findByLeaderId(leader.getId())).thenReturn(team);
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), member.getId())).thenReturn(Optional.of(memberMembership));
        when(projectRepository.existsByStudentIdAndStatusNot(member.getId(), ProjectStatus.ARCHIVED)).thenReturn(true);

        assertThatThrownBy(() -> teamService.removeMemberFromMyTeam(leader.getEmail(), member.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cannot remove member because they are linked to an active project.");
    }

    @Test
    void teamNameCanBeEditedBeforeProjectSubmission() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.empty());
        when(teamRepository.save(team)).thenReturn(team);
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(leaderMembership));

        var response = teamService.updateMyTeam(leader.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO("Updated Team"));

        assertThat(response.name()).isEqualTo("Updated Team");
    }

    @Test
    void leaderCanEditTeamNameAfterProjectSubmissionAndProjectTitleIsUpdated() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTeam(team);
        project.setStatus(ProjectStatus.SUBMITTED);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(project)).thenReturn(project);
        when(teamRepository.save(team)).thenReturn(team);
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(leaderMembership));

        var response = teamService.updateMyTeam(leader.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO("Updated Team"));

        assertThat(response.name()).isEqualTo("Updated Team");
        assertThat(project.getTitle()).isEqualTo("Updated Team");
    }

    @Test
    void leaderCanEditProjectCategoryAndProjectKeepsItAfterRefresh() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTeam(team);
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setProjectDomain("Web");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(project)).thenReturn(project);
        when(teamRepository.save(team)).thenReturn(team);
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(leaderMembership));

        var response = teamService.updateMyTeam(leader.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO(null, "Mobile"));

        assertThat(response.projectDomain()).isEqualTo("Mobile");
        assertThat(team.getProjectDomain()).isEqualTo("Mobile");
        assertThat(project.getProjectDomain()).isEqualTo("Mobile");
    }

    @Test
    void normalMemberCannotEditTeamProjectName() {
        TeamMember memberRole = membership(team, member, "MEMBER");
        when(userRepository.findByEmail(member.getEmail())).thenReturn(Optional.of(member));
        when(teamMemberRepository.findByUserId(member.getId())).thenReturn(Optional.of(memberRole));

        assertThatThrownBy(() -> teamService.updateMyTeam(member.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO("Updated Team")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only team leaders can update team name");
    }

    @Test
    void cannotEditTeamProjectNameIfProjectIsArchived() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTeam(team);
        project.setStatus(ProjectStatus.ARCHIVED);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> teamService.updateMyTeam(leader.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO("Updated Team")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Project name cannot be changed after archive.");
    }

    @Test
    void cannotEditProjectCategoryIfProjectIsArchived() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTeam(team);
        project.setStatus(ProjectStatus.ARCHIVED);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> teamService.updateMyTeam(leader.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO(null, "Mobile")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Project category cannot be changed after archive.");
    }

    @Test
    void emptyTeamProjectNameIsRejected() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));

        assertThatThrownBy(() -> teamService.updateMyTeam(leader.getEmail(), new com.gradproject.platform.modules.team.dto.TeamUpdateDTO("   ")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Team name is required");
    }

    @Test
    void teamCanBeDisbandedIfItHasNoProject() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(invitationRepository.countByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING)).thenReturn(0L);
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.empty());

        teamService.leaveMyTeam(leader.getEmail());

        verify(supervisorRequestRepository).deleteByTeamId(team.getId());
        verify(teamMemberRepository).deleteByTeamId(team.getId());
        verify(teamRepository).delete(team);
    }

    @Test
    void soloLeaderCanDisbandTeamEvenIfProjectExists() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setTeam(team);
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(invitationRepository.countByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING)).thenReturn(0L);
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(projectRepository.save(project)).thenReturn(project);

        teamService.leaveMyTeam(leader.getEmail());

        assertThat(project.getTeam()).isNull();
        verify(supervisorRequestRepository).deleteByTeamId(team.getId());
        verify(projectRepository).save(project);
        verify(teamRepository).delete(team);
    }

    @Test
    void teamCannotBeDisbandedWhilePendingInvitationsExist() {
        TeamMember leaderMembership = membership(team, leader, "LEADER");
        when(userRepository.findByEmail(leader.getEmail())).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByUserId(leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(team.getId(), leader.getId())).thenReturn(Optional.of(leaderMembership));
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(1L);
        when(invitationRepository.countByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING)).thenReturn(2L);

        assertThatThrownBy(() -> teamService.leaveMyTeam(leader.getEmail()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You can only disband the team after removing other members and cancelling pending invitations.");

        verify(supervisorRequestRepository, never()).deleteByTeamId(team.getId());
        verify(teamRepository, never()).delete(team);
    }

    private static User user(UUID id, String email) {
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
        team.setProjectDomain("Web");
        team.setMaxSize(5);
        team.setLeader(leader);
        return team;
    }

    private static TeamMember membership(Team team, User user, String role) {
        return TeamMember.builder()
                .team(team)
                .user(user)
                .memberRole(role)
                .membershipStatus("ACTIVE")
                .build();
    }
}
