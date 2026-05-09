package com.gradproject.platform.modules.task;

import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectCollaborationAccessService;
import com.gradproject.platform.modules.task.dto.TaskStatusUpdateRequestDTO;
import com.gradproject.platform.modules.task.dto.TaskUpsertRequestDTO;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock TaskRepository taskRepository;
    @Mock ProjectCollaborationAccessService accessService;
    @Mock NotificationService notificationService;

    @InjectMocks TaskService taskService;

    @Test
    void createTaskAssignsProjectMemberAndNotifiesAssignee() {
        Project project = project();
        User supervisor = user("supervisor@example.com", UserRole.ROLE_SUPERVISOR);
        User assignee = user("student@example.com", UserRole.ROLE_STUDENT);
        TaskUpsertRequestDTO request = new TaskUpsertRequestDTO("Build API", "Create endpoints", assignee.getId(), LocalDate.now().plusDays(2), TaskPriority.HIGH, null);

        when(accessService.requireProjectManageAccess(project.getId())).thenReturn(project);
        when(accessService.requireCurrentUser()).thenReturn(supervisor);
        when(accessService.requireAssignableProjectMember(project, assignee.getId())).thenReturn(assignee);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
            return task;
        });

        var response = taskService.createTask(project.getId(), request);

        assertThat(response.title()).isEqualTo("Build API");
        assertThat(response.assignedToId()).isEqualTo(assignee.getId());
        assertThat(response.priority()).isEqualTo(TaskPriority.HIGH);
        assertThat(response.status()).isEqualTo(TaskStatus.NOT_STARTED);
        verify(notificationService, times(1)).createNotification(any(), any(), any(), any(), any());
    }

    @Test
    void assignedStudentCanUpdateTaskStatus() {
        Project project = project();
        User student = user("student@example.com", UserRole.ROLE_STUDENT);
        Task task = new Task();
        ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
        task.setProject(project);
        task.setTitle("Build API");
        task.setAssignedTo(student);
        task.setStatus(TaskStatus.NOT_STARTED);

        when(taskRepository.findById(task.getId())).thenReturn(java.util.Optional.of(task));
        when(accessService.requireCurrentUser()).thenReturn(student);
        when(accessService.isProjectStudent(project, student)).thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = taskService.updateTaskStatus(task.getId(), new TaskStatusUpdateRequestDTO(TaskStatus.IN_PROGRESS));

        assertThat(response.status()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    void studentSeesTasksAssignedToTeammateInSameTeam() {
        Project project = project();
        User student = user("student@example.com", UserRole.ROLE_STUDENT);
        User teammate = user("teammate@example.com", UserRole.ROLE_STUDENT);
        Task ownTask = task(project, student, "Own task");
        Task teammateTask = task(project, teammate, "Teammate task");

        when(accessService.requireProjectViewAccess(project.getId())).thenReturn(project);
        when(taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId())).thenReturn(List.of(ownTask, teammateTask));

        var response = taskService.getProjectTasks(project.getId());

        assertThat(response).hasSize(2);
        assertThat(response).extracting("assignedToId").contains(student.getId(), teammate.getId());
    }

    @Test
    void studentCannotUpdateTeammateTaskStatus() {
        Project project = project();
        User student = user("student@example.com", UserRole.ROLE_STUDENT);
        User teammate = user("teammate@example.com", UserRole.ROLE_STUDENT);
        Task task = task(project, teammate, "Teammate task");

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(accessService.requireCurrentUser()).thenReturn(student);

        assertThatThrownBy(() -> taskService.updateTaskStatus(task.getId(), new TaskStatusUpdateRequestDTO(TaskStatus.IN_PROGRESS)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only the assigned student can update this task status.");
    }

    @Test
    void unrelatedStudentCannotSeeAnotherTeamsTasks() {
        UUID projectId = UUID.randomUUID();
        when(accessService.requireProjectViewAccess(projectId))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this project workflow."));

        assertThatThrownBy(() -> taskService.getProjectTasks(projectId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("You are not allowed to access this project workflow.");
    }

    private static Project project() {
        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setTitle("Project A");
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", UUID.randomUUID());
        team.setName("Team A");
        project.setTeam(team);
        return project;
    }

    private static Task task(Project project, User assignee, String title) {
        Task task = new Task();
        ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
        task.setProject(project);
        task.setTitle(title);
        task.setAssignedTo(assignee);
        task.setStatus(TaskStatus.NOT_STARTED);
        return task;
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
}
