package com.gradproject.platform.modules.team.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.gradproject.platform.modules.team.TeamRules;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTeamRequest(
        @NotBlank(message = "Team name is required")
        @Size(min = 3, max = 100)
        String name,

        @JsonAlias({"projectCategory", "projectDomain", "domain", "category"})
        @NotBlank(message = "Project category is required")
        @Size(max = 100, message = "Project category must be 100 characters or fewer.")
        String projectDomain,

        @JsonAlias({"maxMembers", "teamSize", "maximumSize"})
        @Max(value = TeamRules.MAX_MEMBERS, message = "Team maximum size is 5 members.")
        Integer maxSize
) {}
