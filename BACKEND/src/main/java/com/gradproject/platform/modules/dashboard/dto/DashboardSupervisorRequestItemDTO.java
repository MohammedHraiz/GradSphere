package com.gradproject.platform.modules.dashboard.dto;

import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;

import java.time.Instant;
import java.util.UUID;

public record DashboardSupervisorRequestItemDTO(
        UUID requestId,
        UUID projectId,
        String projectTitle,
        String teamName,
        String supervisorName,
        String requestedByName,
        SupervisorRequestStatus status,
        String message,
        Instant createdAt
) {
}
