package com.gradproject.platform.modules.dashboard.dto;

import com.gradproject.platform.modules.project.ProjectStatus;

import java.time.Instant;
import java.util.UUID;

public record DashboardProjectItemDTO(
        UUID projectId,
        String projectTitle,
        String projectDomain,
        String teamName,
        ProjectStatus status,
        String supervisorName,
        Instant createdAt,
        Instant updatedAt
) {
}
