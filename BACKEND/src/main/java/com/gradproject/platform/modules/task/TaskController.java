package com.gradproject.platform.modules.task;

import com.gradproject.platform.modules.task.dto.TaskResponseDTO;
import com.gradproject.platform.modules.task.dto.TaskStatusUpdateRequestDTO;
import com.gradproject.platform.modules.task.dto.TaskUpsertRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponseDTO>> getProjectTasks(@PathVariable UUID projectId) {
        return ResponseEntity.ok(taskService.getProjectTasks(projectId));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponseDTO> createTask(@PathVariable UUID projectId, @RequestBody TaskUpsertRequestDTO request) {
        return ResponseEntity.ok(taskService.createTask(projectId, request));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @PatchMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponseDTO> updateTask(@PathVariable UUID taskId, @RequestBody TaskUpsertRequestDTO request) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<TaskResponseDTO> updateTaskStatus(@PathVariable UUID taskId, @RequestBody TaskStatusUpdateRequestDTO request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, request));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}
