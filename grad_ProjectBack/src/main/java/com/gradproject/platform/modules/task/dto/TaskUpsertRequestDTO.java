package com.gradproject.platform.modules.task.dto;

import com.gradproject.platform.modules.task.TaskPriority;
import com.gradproject.platform.modules.task.TaskStatus;

import java.time.LocalDate;
import java.util.UUID;

public record TaskUpsertRequestDTO(
        String title,
        String description,
        UUID assignedToId,
        LocalDate dueDate,
        TaskPriority priority,
        TaskStatus status
) {
}
