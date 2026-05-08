package com.gradproject.platform.modules.dashboard;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.invitation.InvitationRepository;
import com.gradproject.platform.modules.invitation.InvitationStatus;
import com.gradproject.platform.modules.meeting.MeetingRepository;
import com.gradproject.platform.modules.milestone.MilestoneRepository;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestRepository;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.team.TeamRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock UserRepository userRepository;
    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock InvitationRepository invitationRepository;
    @Mock ProjectRepository projectRepository;
    @Mock SupervisorRequestRepository supervisorRequestRepository;
    @Mock MeetingRepository meetingRepository;
    @Mock TaskRepository taskRepository;
    @Mock MilestoneRepository milestoneRepository;

    DashboardService service;
    User student;
    User supervisor;
    User dean;
    User admin;

    @BeforeEach
    void setUp() {
        service = new DashboardService(
                userRepository,
                teamRepository,
                teamMemberRepository,
                invitationRepository,
                projectRepository,
                supervisorRequestRepository,
                meetingRepository,
                taskRepository,
                milestoneRepository
        );
        lenient().when(taskRepository.findByStatusInAndDueDateBefore(anyCollection(), any())).thenReturn(List.of());
        lenient().when(taskRepository.findByProjectIdIn(anyCollection())).thenReturn(List.of());
        lenient().when(milestoneRepository.findByProjectIdIn(anyCollection())).thenReturn(List.of());
        student = user("student@example.com", UserRole.ROLE_STUDENT);
        supervisor = user("supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        dean = user("dean@example.com", UserRole.ROLE_DEAN_OFFICE);
        admin = user("admin@example.com", UserRole.ROLE_ADMIN);
    }

    @Test
    void studentWithNoTeamGetsSafeEmptyResponse() {
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.empty());
        when(invitationRepository.countByReceiverIdAndStatus(student.getId(), InvitationStatus.PENDING)).thenReturn(2L);

        var dto = service.getStudentDashboard();

        assertThat(dto.hasTeam()).isFalse();
        assertThat(dto.pendingReceivedInvitationsCount()).isEqualTo(2);
        assertThat(dto.proposalSubmitted()).isFalse();
        assertThat(dto.taskSummary().total()).isZero();
    }

    @Test
    void studentSeesOnlyOwnTeamDashboardData() {
        authenticate(student);
        Team team = team(student);
        Project project = project(team, student, ProjectStatus.NEEDS_CHANGES);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.of(member(team, student, "LEADER")));
        when(teamMemberRepository.countByTeamId(team.getId())).thenReturn(3L);
        when(invitationRepository.countByReceiverIdAndStatus(student.getId(), InvitationStatus.PENDING)).thenReturn(1L);
        when(invitationRepository.countByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING)).thenReturn(4L);
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(supervisorRequestRepository.findFirstByTeamIdAndStatusOrderByCreatedAtDesc(team.getId(), SupervisorRequestStatus.PENDING)).thenReturn(Optional.empty());
        when(supervisorRequestRepository.findFirstByTeamIdOrderByCreatedAtDesc(team.getId())).thenReturn(Optional.empty());
        when(meetingRepository.countByProjectIdAndMeetingDateAfter(org.mockito.ArgumentMatchers.eq(project.getId()), org.mockito.ArgumentMatchers.any())).thenReturn(1L);
        when(meetingRepository.countByProjectIdAndMeetingDateBefore(org.mockito.ArgumentMatchers.eq(project.getId()), org.mockito.ArgumentMatchers.any())).thenReturn(2L);

        var dto = service.getStudentDashboard();

        assertThat(dto.teamId()).isEqualTo(team.getId());
        assertThat(dto.projectId()).isEqualTo(project.getId());
        assertThat(dto.pendingSentInvitationsCount()).isEqualTo(4);
        assertThat(dto.proposalCanResubmit()).isTrue();
        assertThat(dto.taskSummary().total()).isZero();
    }

    @Test
    void supervisorSeesOnlyAssignedProjectCounts() {
        authenticate(supervisor);
        Project project = project(team(student), student, ProjectStatus.UNDER_REVIEW);
        project.setSupervisor(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(project));
        when(supervisorRequestRepository.countBySupervisorIdAndStatus(supervisor.getId(), SupervisorRequestStatus.PENDING)).thenReturn(2L);
        when(projectRepository.countBySupervisorIdAndStatus(supervisor.getId(), ProjectStatus.UNDER_REVIEW)).thenReturn(1L);
        when(supervisorRequestRepository.findTop5BySupervisorIdAndStatusOrderByCreatedAtDesc(supervisor.getId(), SupervisorRequestStatus.PENDING)).thenReturn(List.of());
        when(projectRepository.findTop5BySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(project));

        var dto = service.getSupervisorDashboard();

        assertThat(dto.pendingSupervisorRequestsCount()).isEqualTo(2);
        assertThat(dto.assignedProjectsCount()).isEqualTo(1);
        assertThat(dto.underReviewProjectsCount()).isEqualTo(1);
        assertThat(dto.taskSummary().total()).isZero();
    }

    @Test
    void deanGetsProjectSummaryCounts() {
        authenticate(dean);
        when(userRepository.findById(dean.getId())).thenReturn(Optional.of(dean));
        when(projectRepository.findAll()).thenReturn(List.of(project(team(student), student, ProjectStatus.SUBMITTED)));
        when(projectRepository.countByStatus(ProjectStatus.SUBMITTED)).thenReturn(1L);
        when(projectRepository.countBySupervisorIsNull()).thenReturn(1L);
        when(supervisorRequestRepository.countByStatus(SupervisorRequestStatus.PENDING)).thenReturn(3L);
        when(teamRepository.count()).thenReturn(2L);
        when(userRepository.countByRole(UserRole.ROLE_STUDENT)).thenReturn(8L);
        when(userRepository.countByRole(UserRole.ROLE_SUPERVISOR)).thenReturn(4L);
        when(projectRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(supervisorRequestRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of());

        var dto = service.getDeanDashboard();

        assertThat(dto.totalProjects()).isEqualTo(1);
        assertThat(dto.submittedProjectsCount()).isEqualTo(1);
        assertThat(dto.pendingSupervisorRequestsCount()).isEqualTo(3);
        assertThat(dto.taskSummary().total()).isZero();
    }

    @Test
    void adminGetsUserAndProjectCounts() {
        authenticate(admin);
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(projectRepository.findAll()).thenReturn(List.of(project(team(student), student, ProjectStatus.ARCHIVED)));
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(UserRole.ROLE_STUDENT)).thenReturn(6L);
        when(userRepository.countByRole(UserRole.ROLE_SUPERVISOR)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.ROLE_DEAN_OFFICE)).thenReturn(1L);
        when(userRepository.countByRole(UserRole.ROLE_ADMIN)).thenReturn(1L);
        when(teamRepository.count()).thenReturn(3L);
        when(projectRepository.countByStatus(ProjectStatus.ARCHIVED)).thenReturn(1L);
        when(invitationRepository.countByStatus(InvitationStatus.PENDING)).thenReturn(5L);
        when(supervisorRequestRepository.countByStatus(SupervisorRequestStatus.PENDING)).thenReturn(2L);
        when(projectRepository.countBySupervisorIsNull()).thenReturn(4L);
        when(userRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of(admin));
        when(projectRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of());

        var dto = service.getAdminDashboard();

        assertThat(dto.totalUsers()).isEqualTo(10);
        assertThat(dto.pendingInvitationsCount()).isEqualTo(5);
        assertThat(dto.archivedProjectsCount()).isEqualTo(1);
        assertThat(dto.taskSummary().total()).isZero();
    }

    @Test
    void unauthorizedRoleCannotAccessAnotherDashboard() {
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.getAdminDashboard())
                .isInstanceOf(BadRequestException.class)
                .hasMessage("You are not allowed to view this dashboard.");
    }

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    private static User user(String email, UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(role);
        return user;
    }

    private static Team team(User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName("Team");
        team.setLeader(leader);
        team.setMaxSize(5);
        return team;
    }

    private static TeamMember member(Team team, User user, String role) {
        return TeamMember.builder().team(team).user(user).memberRole(role).membershipStatus("ACTIVE").build();
    }

    private static Project project(Team team, User student, ProjectStatus status) {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle("Project");
        project.setDescription("Description");
        project.setTeam(team);
        project.setStudent(student);
        project.setStatus(status);
        return project;
    }
}
