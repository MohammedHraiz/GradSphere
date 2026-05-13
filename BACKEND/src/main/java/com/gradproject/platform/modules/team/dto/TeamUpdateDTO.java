package com.gradproject.platform.modules.team.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

public record TeamUpdateDTO(
        @Size(max = 100, message = "Team name must be 100 characters or fewer.")
        String name,

        @JsonAlias({"projectCategory", "projectDomain", "domain", "category"})
        @Size(max = 100, message = "Project category must be 100 characters or fewer.")
        String projectDomain
) {
        public TeamUpdateDTO(String name) {
                this(name, null);
        }
}
