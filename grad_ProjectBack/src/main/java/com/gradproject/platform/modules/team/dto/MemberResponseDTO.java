package com.gradproject.platform.modules.team.dto;

import java.util.UUID;

public record MemberResponseDTO(
        UUID userId,
        String name,
        String universityId,
        String memberRole
) {
}

