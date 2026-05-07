package com.gradproject.platform.modules.user.dto;

import java.util.UUID;

public record UserResponseDTO(
        UUID id,
        String name,
        String email,
        String role,
        boolean hasTeam
) {
}
