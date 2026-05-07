package com.gradproject.platform.modules.supervisorrequest.dto;

import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;

import java.time.Instant;
import java.util.UUID;

public record SupervisorRequestDTO(
        UUID id,
        UUID projectId,
        String projectTitle,
        String projectDescription,
        UUID teamId,
        String teamName,
        String requestedByName,
        String requestedByEmail,
        UUID supervisorId,
        String supervisorName,
        String supervisorEmail,
        SupervisorRequestStatus status,
        String message,
        String responseMessage,
        Instant createdAt,
        Instant respondedAt
) {
}
