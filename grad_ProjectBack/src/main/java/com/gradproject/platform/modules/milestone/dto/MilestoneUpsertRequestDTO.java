package com.gradproject.platform.modules.milestone.dto;

import com.gradproject.platform.modules.milestone.MilestoneStatus;

import java.time.Instant;
import java.time.LocalDate;

public record MilestoneUpsertRequestDTO(
        String title,
        String description,
        LocalDate deadlineDate,
        String keyRequirements,
        MilestoneStatus status,
        Instant completedDate,
        String reviewFeedback
) {
}
