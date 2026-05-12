package com.gradproject.platform.modules.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TeamUpdateDTO(
        @NotBlank(message = "Team name is required")
        @Size(min = 3, max = 100)
        String name
) {
}
