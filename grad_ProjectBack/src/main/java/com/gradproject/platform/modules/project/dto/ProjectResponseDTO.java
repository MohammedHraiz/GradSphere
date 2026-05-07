package com.gradproject.platform.modules.project.dto;

import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.user.dto.SupervisorSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponseDTO(
        UUID id,
        String title,
        String description,
        String documentPath,
        Integer proposalVersion,
        ProjectStatus status,
        UUID studentId,
        String studentName,
        String studentEmail,
        UUID teamId,
        String teamName,
        SupervisorSummaryDTO supervisor,
        String latestFeedback,
        UUID pendingSupervisorRequestId,
        SupervisorRequestStatus pendingSupervisorRequestStatus,
        String pendingSupervisorName,
        String lastSupervisorRequestResponseMessage,
        Instant submittedAt,
        Instant updatedAt
) {
}
