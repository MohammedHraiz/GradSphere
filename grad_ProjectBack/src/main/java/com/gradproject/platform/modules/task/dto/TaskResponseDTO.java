package com.gradproject.platform.modules.task.dto;

import com.gradproject.platform.modules.task.TaskPriority;
import com.gradproject.platform.modules.task.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TaskResponseDTO(
        UUID id,
        UUID projectId,
        String projectTitle,
        String title,
        String description,
        UUID assignedToId,
        String assignedToName,
        String assignedToUniversityId,
        LocalDate dueDate,
        TaskPriority priority,
        TaskStatus status,
        boolean overdue,
        UUID createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {
}
