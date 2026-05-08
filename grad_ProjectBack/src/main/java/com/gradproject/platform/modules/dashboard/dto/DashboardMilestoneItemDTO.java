package com.gradproject.platform.modules.dashboard.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DashboardMilestoneItemDTO(
        UUID milestoneId,
        UUID projectId,
        String projectTitle,
        String title,
        LocalDate dueDate,
        boolean completed,
        Instant completedDate
) {
}
