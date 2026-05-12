package com.gradproject.platform.modules.dean;

import com.gradproject.platform.modules.milestone.Milestone;
import com.gradproject.platform.modules.milestone.MilestoneRepository;
import com.gradproject.platform.modules.milestone.MilestoneStatus;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.task.Task;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.task.TaskStatus;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.team.TeamRepository;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserDepartment;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeanDirectoryServiceTest {

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
    private MilestoneRepository milestoneRepository;

    private DeanDirectoryService service;

    @BeforeEach
    void setUp() {
        service = new DeanDirectoryService(userRepository, teamRepository, teamMemberRepository, projectRepository, taskRepository, milestoneRepository);
    }

    @Test
    void deanAdminCanFetchSupervisorsWithoutSensitiveFields() {
        User supervisor = user("Dr. Sara", "sara@example.com", UserRole.ROLE_SUPERVISOR);
        supervisor.setDepartment(UserDepartment.SOFTWARE_ENGINEERING);
        supervisor.setPasswordHash("secret");
        supervisor.setOtpCode("123456");
        when(userRepository.findByRoleOrderByNameAsc(UserRole.ROLE_SUPERVISOR)).thenReturn(List.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of());

        var result = service.getSupervisors();

        assertThat(result).singleElement().satisfies(dto -> {
            assertThat(dto.id()).isEqualTo(supervisor.getId());
            assertThat(dto.department()).isEqualTo("SOFTWARE_ENGINEERING");
            assertThat(dto.assignedProjectsCount()).isZero();
            assertThat(dto.capacityLimit()).isEqualTo(5);
            assertThat(dto.capacityStatus()).isEqualTo("AVAILABLE");
            assertThat(dto.latestAssignedProjects()).isEmpty();
        });
        assertThat(List.of(result.get(0).getClass().getRecordComponents()))
                .extracting(component -> component.getName())
                .doesNotContain("password", "passwordHash", "otpCode", "otpExpiresAt");
    }

    @Test
    void teamWithNoProjectOrSupervisorDoesNotCrash() {
        User leader = user("Leader Student", "leader@example.com", UserRole.ROLE_STUDENT);
        Team team = team("Smart Campus", leader);
        TeamMember leaderMember = member(team, leader, "LEADER");

        when(teamRepository.findAll()).thenReturn(List.of(team));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(leaderMember));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.empty());

        var result = service.getTeams();

        assertThat(result).singleElement().satisfies(dto -> {
            assertThat(dto.teamName()).isEqualTo("Smart Campus");
            assertThat(dto.projectId()).isNull();
            assertThat(dto.projectHealth()).isNull();
            assertThat(dto.supervisor()).isNull();
            assertThat(dto.members()).hasSize(1);
        });
    }

    @Test
    void studentsWithNoTeamOrProjectDoNotCrashAndDoNotExposeGpa() {
        User student = user("Student One", "student@example.com", UserRole.ROLE_STUDENT);
        student.setDepartment(UserDepartment.COMPUTER_SCIENCE);

        when(userRepository.findByRoleOrderByNameAsc(UserRole.ROLE_STUDENT)).thenReturn(List.of(student));
        when(teamMemberRepository.findByUserId(student.getId())).thenReturn(Optional.empty());
        when(projectRepository.findByStudentId(student.getId())).thenReturn(Optional.empty());

        var result = service.getStudents();

        assertThat(result).singleElement().satisfies(dto -> {
            assertThat(dto.name()).isEqualTo("Student One");
            assertThat(dto.department()).isEqualTo("COMPUTER_SCIENCE");
            assertThat(dto.teamId()).isNull();
            assertThat(dto.projectId()).isNull();
        });
        assertThat(List.of(result.get(0).getClass().getRecordComponents()))
                .extracting(component -> component.getName())
                .doesNotContain("gpa", "GPA");
    }

    @Test
    void teamsIncludeMembersAndProjectData() {
        User leader = user("Leader Student", "leader@example.com", UserRole.ROLE_STUDENT);
        User member = user("Member Student", "member@example.com", UserRole.ROLE_STUDENT);
        User supervisor = user("Dr. Ahmad", "ahmad@example.com", UserRole.ROLE_SUPERVISOR);
        Team team = team("Smart Campus", leader);
        team.setSupervisor(supervisor);
        Project project = project("Smart Campus", team, leader, supervisor);

        when(teamRepository.findAll()).thenReturn(List.of(team));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, leader, "LEADER"), member(team, member, "MEMBER")));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId())).thenReturn(List.of());
        when(milestoneRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId())).thenReturn(List.of());

        var result = service.getTeams();

        assertThat(result).singleElement().satisfies(dto -> {
            assertThat(dto.projectTitle()).isEqualTo("Smart Campus");
            assertThat(dto.projectStatus()).isEqualTo("SUBMITTED");
            assertThat(dto.projectHealth()).isEqualTo("ON_TRACK");
            assertThat(dto.supervisor().email()).isEqualTo("ahmad@example.com");
            assertThat(dto.members()).hasSize(2);
        });
    }

    @Test
    void supervisorCapacityUsesFiveProjectLimit() {
        User supervisor = user("Dr. Load", "load@example.com", UserRole.ROLE_SUPERVISOR);
        when(userRepository.findByRoleOrderByNameAsc(UserRole.ROLE_SUPERVISOR)).thenReturn(List.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(
                project("P1", null, null, supervisor),
                project("P2", null, null, supervisor),
                project("P3", null, null, supervisor),
                project("P4", null, null, supervisor)
        ));

        assertThat(service.getSupervisors()).singleElement()
                .extracting("capacityStatus")
                .isEqualTo("AVAILABLE");

        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(
                project("P1", null, null, supervisor),
                project("P2", null, null, supervisor),
                project("P3", null, null, supervisor),
                project("P4", null, null, supervisor),
                project("P5", null, null, supervisor)
        ));

        assertThat(service.getSupervisors()).singleElement()
                .extracting("capacityStatus")
                .isEqualTo("FULL_CAPACITY");

        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(
                project("P1", null, null, supervisor),
                project("P2", null, null, supervisor),
                project("P3", null, null, supervisor),
                project("P4", null, null, supervisor),
                project("P5", null, null, supervisor),
                project("P6", null, null, supervisor)
        ));

        assertThat(service.getSupervisors()).singleElement()
                .extracting("capacityStatus")
                .isEqualTo("OVERLOADED");
    }

    @Test
    void projectHealthUsesOverdueBlockedAndCompletionSignals() {
        User leader = user("Leader Student", "leader@example.com", UserRole.ROLE_STUDENT);
        User supervisor = user("Dr. Ahmad", "ahmad@example.com", UserRole.ROLE_SUPERVISOR);
        Team team = team("Smart Campus", leader);
        Project project = project("Smart Campus", team, leader, supervisor);

        when(teamRepository.findAll()).thenReturn(List.of(team));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, leader, "LEADER")));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(milestoneRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId())).thenReturn(List.of());
        when(taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()))
                .thenReturn(List.of(task(project, TaskStatus.IN_PROGRESS, LocalDate.now().minusDays(1))));

        assertThat(service.getTeams()).singleElement()
                .extracting("projectHealth")
                .isEqualTo("DELAYED");

        when(taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()))
                .thenReturn(List.of(task(project, TaskStatus.BLOCKED, LocalDate.now().plusDays(1))));

        assertThat(service.getTeams()).singleElement()
                .extracting("projectHealth")
                .isEqualTo("AT_RISK");

        when(taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()))
                .thenReturn(List.of(
                        task(project, TaskStatus.COMPLETED, LocalDate.now().plusDays(1)),
                        task(project, TaskStatus.COMPLETED, LocalDate.now().plusDays(2)),
                        task(project, TaskStatus.COMPLETED, LocalDate.now().plusDays(3)),
                        task(project, TaskStatus.COMPLETED, LocalDate.now().plusDays(4)),
                        task(project, TaskStatus.IN_PROGRESS, LocalDate.now().plusDays(5))
                ));

        assertThat(service.getTeams()).singleElement()
                .extracting("projectHealth")
                .isEqualTo("EXCELLENT");
    }

    @Test
    void projectHealthUsesMilestoneSignals() {
        User leader = user("Leader Student", "leader@example.com", UserRole.ROLE_STUDENT);
        User supervisor = user("Dr. Ahmad", "ahmad@example.com", UserRole.ROLE_SUPERVISOR);
        Team team = team("Smart Campus", leader);
        Project project = project("Smart Campus", team, leader, supervisor);

        when(teamRepository.findAll()).thenReturn(List.of(team));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, leader, "LEADER")));
        when(projectRepository.findByTeamId(team.getId())).thenReturn(Optional.of(project));
        when(taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId())).thenReturn(List.of());
        when(milestoneRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()))
                .thenReturn(List.of(milestone(project, MilestoneStatus.IN_PROGRESS, LocalDate.now().minusDays(1))));

        assertThat(service.getTeams()).singleElement()
                .extracting("projectHealth")
                .isEqualTo("DELAYED");

        when(milestoneRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()))
                .thenReturn(List.of(milestone(project, MilestoneStatus.NEEDS_CHANGES, LocalDate.now().plusDays(1))));

        assertThat(service.getTeams()).singleElement()
                .extracting("projectHealth")
                .isEqualTo("AT_RISK");
    }

    private static User user(String name, String email, UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setPasswordHash("secret");
        return user;
    }

    private static Team team(String name, User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName(name);
        team.setLeader(leader);
        team.setMaxSize(5);
        team.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return team;
    }

    private static TeamMember member(Team team, User user, String role) {
        TeamMember teamMember = new TeamMember();
        ReflectionTestUtils.setField(teamMember, "id", UUID.randomUUID());
        teamMember.setTeam(team);
        teamMember.setUser(user);
        teamMember.setMemberRole(role);
        teamMember.setMembershipStatus("ACTIVE");
        return teamMember;
    }

    private static Project project(String title, Team team, User student, User supervisor) {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle(title);
        project.setTeam(team);
        project.setStudent(student);
        project.setSupervisor(supervisor);
        project.setStatus(ProjectStatus.SUBMITTED);
        project.setCreatedAt(Instant.parse("2026-01-02T00:00:00Z"));
        return project;
    }

    private static Task task(Project project, TaskStatus status, LocalDate dueDate) {
        Task task = new Task();
        ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
        task.setProject(project);
        task.setTitle("Task");
        task.setStatus(status);
        task.setDueDate(dueDate);
        return task;
    }

    private static Milestone milestone(Project project, MilestoneStatus status, LocalDate dueDate) {
        Milestone milestone = new Milestone();
        ReflectionTestUtils.setField(milestone, "id", UUID.randomUUID());
        milestone.setProject(project);
        milestone.setTitle("Milestone");
        milestone.setStatus(status);
        milestone.setDueDate(dueDate);
        return milestone;
    }
}
