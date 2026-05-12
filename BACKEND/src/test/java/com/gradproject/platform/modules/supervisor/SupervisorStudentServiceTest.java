package com.gradproject.platform.modules.supervisor;

import com.gradproject.platform.modules.meeting.MeetingRepository;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.task.TaskRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserDepartment;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

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
class SupervisorStudentServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TaskRepository taskRepository;
    @Mock MeetingRepository meetingRepository;
    @Mock UserRepository userRepository;

    SupervisorStudentService service;
    User supervisor;
    User student;
    User teammate;
    User unrelatedStudent;
    Team team;
    Project assignedProject;

    @BeforeEach
    void setUp() {
        service = new SupervisorStudentService(projectRepository, teamMemberRepository, taskRepository, meetingRepository, userRepository);
        supervisor = user("supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        student = user("student@example.com", UserRole.ROLE_STUDENT);
        teammate = user("teammate@example.com", UserRole.ROLE_STUDENT);
        unrelatedStudent = user("unrelated@example.com", UserRole.ROLE_STUDENT);
        student.setDepartment(UserDepartment.COMPUTER_SCIENCE);
        team = team("Team A", student);
        assignedProject = project("Assigned Project", team, student, supervisor);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignedSupervisorSeesStudentsFromAssignedProjects() {
        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(assignedProject));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of(member(team, teammate, "MEMBER")));

        var result = service.getMyStudents();

        assertThat(result).hasSize(2);
        assertThat(result).extracting("studentId").contains(student.getId(), teammate.getId());
        assertThat(result).allSatisfy(item -> {
            assertThat(item.projectId()).isEqualTo(assignedProject.getId());
            assertThat(item.teamName()).isEqualTo("Team A");
        });
        assertThat(result).anySatisfy(item -> {
            assertThat(item.studentId()).isEqualTo(student.getId());
            assertThat(item.department()).isEqualTo("COMPUTER_SCIENCE");
        });
    }

    @Test
    void supervisorDoesNotSeeStudentsFromUnassignedProjects() {
        User otherSupervisor = user("other-supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        Project unassignedProject = project("Other Project", team("Team B", unrelatedStudent), unrelatedStudent, otherSupervisor);

        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of(assignedProject));
        when(teamMemberRepository.findAllByTeamId(team.getId())).thenReturn(List.of());

        var result = service.getMyStudents();

        assertThat(result).extracting("studentId").contains(student.getId());
        assertThat(result).extracting("studentId").doesNotContain(unassignedProject.getStudent().getId());
    }

    @Test
    void noAssignedProjectsReturnsEmptyList() {
        authenticate(supervisor);
        when(userRepository.findById(supervisor.getId())).thenReturn(Optional.of(supervisor));
        when(projectRepository.findBySupervisorIdOrderByCreatedAtDesc(supervisor.getId())).thenReturn(List.of());

        assertThat(service.getMyStudents()).isEmpty();
    }

    @Test
    void nonSupervisorIsRejected() {
        authenticate(student);
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.getMyStudents())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only supervisors can view assigned students.");

        verify(projectRepository, never()).findBySupervisorIdOrderByCreatedAtDesc(any());
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

    private static Team team(String name, User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName(name);
        team.setLeader(leader);
        team.setMaxSize(5);
        return team;
    }

    private static Project project(String title, Team team, User student, User supervisor) {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle(title);
        project.setDescription("Description");
        project.setStatus(ProjectStatus.UNDER_REVIEW);
        project.setTeam(team);
        project.setStudent(student);
        project.setSupervisor(supervisor);
        return project;
    }

    private static TeamMember member(Team team, User user, String role) {
        return TeamMember.builder().team(team).user(user).memberRole(role).membershipStatus("ACTIVE").build();
    }

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }
}
