package com.gradproject.platform.modules.invitation.dto;

import java.time.Instant;
import java.util.UUID;

public record SentInvitationResponseDTO(
        UUID invitationId,
        UUID receiverId,
        String receiverName,
        String receiverEmail,
        String receiverUniversityId,
        String teamName,
        Instant createdAt
) {
}
