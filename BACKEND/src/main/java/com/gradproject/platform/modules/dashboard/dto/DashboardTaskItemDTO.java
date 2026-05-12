package com.gradproject.platform.modules.dashboard.dto;

import com.gradproject.platform.modules.task.TaskStatus;

import java.time.LocalDate;
import java.util.UUID;

public record DashboardTaskItemDTO(
        UUID taskId,
        UUID projectId,
        String projectTitle,
        String title,
        String assignedToName,
        LocalDate dueDate,
        TaskStatus status
) {
}
