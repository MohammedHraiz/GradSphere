package com.gradproject.platform.modules.admin;

import com.gradproject.platform.exception.ProjectNotArchivableException;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArchiveServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;

    ArchiveService service;
    User admin;
    User student;
    Project project;

    @BeforeEach
    void setUp() {
        service = new ArchiveService(projectRepository, userRepository, teamMemberRepository);
        admin = user(UUID.randomUUID(), "admin@example.com", UserRole.ROLE_ADMIN);
        student = user(UUID.randomUUID(), "student@example.com", UserRole.ROLE_STUDENT);
        project = project(UUID.randomUUID(), student, ProjectStatus.APPROVED);
    }

    @Test
    void approvedProjectCanBeArchived() {
        authenticate(admin);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(teamMemberRepository.findAllByTeamId(project.getTeam().getId())).thenReturn(List.of());
        when(userRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.archiveProject(project.getId());

        assertThat(response.getProjectStatus()).isEqualTo(ProjectStatus.ARCHIVED);
        assertThat(project.getStatus()).isEqualTo(ProjectStatus.ARCHIVED);
        assertThat(student.isGraduated()).isTrue();
    }

    @Test
    void nonApprovedProjectCannotBeArchived() {
        project.setStatus(ProjectStatus.UNDER_REVIEW);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> service.archiveProject(project.getId()))
                .isInstanceOf(ProjectNotArchivableException.class)
                .hasMessage("Only approved projects can be archived.");
    }

    @Test
    void archiveCannotBePerformedTwice() {
        project.setStatus(ProjectStatus.ARCHIVED);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> service.archiveProject(project.getId()))
                .isInstanceOf(ProjectNotArchivableException.class)
                .hasMessage("Project is already archived.");
    }

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    private static User user(UUID id, String email, UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(role);
        return user;
    }

    private static Project project(UUID id, User student, ProjectStatus status) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName("Project");
        team.setLeader(student);
        team.setMaxSize(5);

        Project project = new Project();
        project.setId(id);
        project.setTitle("Project");
        project.setDescription("Description");
        project.setStudent(student);
        project.setTeam(team);
        project.setStatus(status);
        return project;
    }
}
