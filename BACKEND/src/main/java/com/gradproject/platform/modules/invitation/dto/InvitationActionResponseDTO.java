package com.gradproject.platform.modules.invitation.dto;

import java.util.UUID;

public record InvitationActionResponseDTO(
        String status,
        String message,
        UUID invitationId,
        UUID teamId
) {
}

