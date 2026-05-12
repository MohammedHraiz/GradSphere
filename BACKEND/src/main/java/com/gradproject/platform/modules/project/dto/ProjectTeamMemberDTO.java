package com.gradproject.platform.modules.project.dto;

import java.util.UUID;

public record ProjectTeamMemberDTO(
        UUID id,
        String name,
        String email,
        String universityId,
        String department,
        String profilePhotoUrl,
        String role
) {
}
