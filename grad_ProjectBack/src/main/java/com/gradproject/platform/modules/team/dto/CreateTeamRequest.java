package com.gradproject.platform.modules.team.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTeamRequest(
        @NotBlank(message = "Team name is required")
        @Size(min = 3, max = 100)
        String name,

        @NotNull(message = "Max size is required")
        @Min(value = 2, message = "Team must have at least 2 members")
        @Max(value = 10, message = "Team cannot exceed 10 members")
        Integer maxSize
) {}