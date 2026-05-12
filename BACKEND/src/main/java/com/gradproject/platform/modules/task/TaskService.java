package com.gradproject.platform.modules.task;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectCollaborationAccessService;
import com.gradproject.platform.modules.task.dto.TaskResponseDTO;
import com.gradproject.platform.modules.task.dto.TaskStatusUpdateRequestDTO;
import com.gradproject.platform.modules.task.dto.TaskUpsertRequestDTO;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectCollaborationAccessService accessService;
    private final NotificationService notificationService;

    public TaskService(TaskRepository taskRepository,
                       ProjectCollaborationAccessService accessService,
                       NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getProjectTasks(UUID projectId) {
        refreshOverdueTasks();
        Project project = accessService.requireProjectViewAccess(projectId);
        return taskRepository.findByProjectIdOrderByDueDateAscCreatedAtDesc(project.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponseDTO createTask(UUID projectId, TaskUpsertRequestDTO request) {
        Project project = accessService.requireProjectManageAccess(projectId);
        User currentUser = accessService.requireCurrentUser();

        Task task = new Task();
        task.setProject(project);
        applyCreatePayload(task, request, project);
        task.setCreatedByUser(currentUser);

        Task savedTask = taskRepository.save(task);
        notifyAssignment(savedTask, currentUser, true);
        return toResponse(savedTask);
    }

    public TaskResponseDTO updateTask(UUID taskId, TaskUpsertRequestDTO request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BadRequestException("Task not found."));
        User currentUser = accessService.requireCurrentUser();
        if (!accessService.canManageProject(task.getProject(), currentUser)) {
            throw new AccessDeniedException("Only the assigned supervisor or team leader can edit task details.");
        }

        UUID previousAssigneeId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
        applyUpdatePayload(task, request, task.getProject());
        Task savedTask = taskRepository.save(task);

        UUID currentAssigneeId = savedTask.getAssignedTo() != null ? savedTask.getAssignedTo().getId() : null;
        if (!Objects.equals(previousAssigneeId, currentAssigneeId)) {
            notifyAssignment(savedTask, currentUser, false);
        }

        return toResponse(savedTask);
    }

    public TaskResponseDTO updateTaskStatus(UUID taskId, TaskStatusUpdateRequestDTO request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BadRequestException("Task not found."));
        User currentUser = accessService.requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_STUDENT) {
            throw new AccessDeniedException("Only the assigned student can update this task status.");
        }
        if (!accessService.isProjectStudent(task.getProject(), currentUser)) {
            throw new AccessDeniedException("You are not allowed to update this task.");
        }
        if (request == null || request.status() == null) {
            throw new BadRequestException("Task status is required.");
        }
        if (task.getAssignedTo() == null) {
            task.setAssignedTo(currentUser);
        } else if (!currentUser.getId().equals(task.getAssignedTo().getId())) {
            throw new AccessDeniedException("Only the assigned student can update this task status.");
        }

        TaskStatus previousStatus = task.getStatus();
        task.setStatus(request.status());
        Task savedTask = taskRepository.save(task);

        if (previousStatus != savedTask.getStatus() && savedTask.getAssignedTo() != null) {
            notificationService.createNotification(
                    savedTask.getAssignedTo(),
                    "Task status updated",
                    currentUser.getName() + " changed task \"" + savedTask.getTitle() + "\" to " + savedTask.getStatus().name() + ".",
                    NotificationType.TASK_STATUS_CHANGED,
                    buildProjectLink(savedTask.getProject().getId())
            );
        }

        return toResponse(savedTask);
    }

    public void deleteTask(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BadRequestException("Task not found."));
        accessService.requireProjectManageAccess(task.getProject().getId());
        taskRepository.delete(task);
    }

    public void refreshOverdueTasks() {
        // Overdue state is computed from due date for dashboards and UI.
    }

    public TaskResponseDTO toResponse(Task task) {
        return new TaskResponseDTO(
                task.getId(),
                task.getProject() != null ? task.getProject().getId() : null,
                task.getProject() != null ? task.getProject().getTitle() : null,
                task.getTitle(),
                task.getDescription(),
                task.getAssignedTo() != null ? task.getAssignedTo().getId() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getName() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getUniversityId() : null,
                task.getDueDate(),
                task.getPriority(),
                task.getStatus(),
                isOverdue(task),
                task.getCreatedByUser() != null ? task.getCreatedByUser().getId() : null,
                task.getCreatedByUser() != null ? task.getCreatedByUser().getName() : null,
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private void applyCreatePayload(Task task, TaskUpsertRequestDTO request, Project project) {
        String title = request.title() == null ? "" : request.title().trim();
        if (!StringUtils.hasText(title)) {
            throw new BadRequestException("Task title is required.");
        }
        task.setTitle(title);
        task.setDescription(StringUtils.hasText(request.description()) ? request.description().trim() : null);
        task.setAssignedTo(accessService.requireAssignableProjectMember(project, request.assignedToId()));
        task.setDueDate(request.dueDate());
        task.setPriority(request.priority() == null ? TaskPriority.MEDIUM : request.priority());
        task.setStatus(TaskStatus.NOT_STARTED);
    }

    private void applyUpdatePayload(Task task, TaskUpsertRequestDTO request, Project project) {
        if (request.title() != null) {
            String title = request.title().trim();
            if (!StringUtils.hasText(title)) {
                throw new BadRequestException("Task title is required.");
            }
            task.setTitle(title);
        }
        if (request.description() != null) {
            task.setDescription(StringUtils.hasText(request.description()) ? request.description().trim() : null);
        }
        task.setAssignedTo(accessService.requireAssignableProjectMember(project, request.assignedToId()));
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
    }

    private void notifyAssignment(Task task, User actor, boolean created) {
        if (task.getAssignedTo() == null) {
            return;
        }
        notificationService.createNotification(
                task.getAssignedTo(),
                created ? "New task assigned" : "Task assignment updated",
                actor.getName() + " assigned task \"" + task.getTitle() + "\" to you.",
                NotificationType.TASK_ASSIGNED,
                buildProjectLink(task.getProject().getId())
        );
    }

    private String buildProjectLink(UUID projectId) {
        return "/project?projectId=" + projectId;
    }

    private boolean isOverdue(Task task) {
        return task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != TaskStatus.COMPLETED;
    }
}
