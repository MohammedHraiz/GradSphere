package com.gradproject.platform.modules.team.dto;

import java.util.UUID;

public record MemberResponseDTO(
        UUID userId,
        String name,
        String email,
        String universityId,
        String department,
        String profilePhotoUrl,
        String memberRole
) {
}

