package com.gradproject.platform.modules.invitation.dto;

import java.time.Instant;
import java.util.UUID;

public record InvitationResponseDTO(
        UUID invitationId,
        String teamName,
        String senderName,
        String senderUniversityId,
        Instant createdAt
) {
}
