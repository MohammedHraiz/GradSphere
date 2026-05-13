package com.gradproject.platform.modules.project.dto;

import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.supervisorrequest.SupervisorRequestStatus;
import com.gradproject.platform.modules.user.dto.SupervisorSummaryDTO;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProjectResponseDTO(
        UUID id,
        String title,
        String description,
        String projectDomain,
        String documentPath,
        Integer proposalVersion,
        ProjectStatus status,
        UUID studentId,
        String studentName,
        String studentEmail,
        UUID teamId,
        String teamName,
        List<ProjectTeamMemberDTO> teamMembers,
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
