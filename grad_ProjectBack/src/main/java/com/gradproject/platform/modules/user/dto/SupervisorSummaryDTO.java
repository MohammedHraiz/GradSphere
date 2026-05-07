package com.gradproject.platform.modules.user.dto;

import java.util.UUID;

public record SupervisorSummaryDTO(
        UUID id,
        String name,
        String email,
        String department,
        Long assignedProjectsCount
) {
}
