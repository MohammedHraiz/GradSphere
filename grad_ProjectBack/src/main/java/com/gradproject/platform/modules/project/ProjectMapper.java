package com.gradproject.platform.modules.project;

import com.gradproject.platform.modules.project.dto.ProjectRequestDTO;

public final class ProjectMapper {

    private ProjectMapper() {
    }

    public static Project toEntity(ProjectRequestDTO dto) {
        Project project = new Project();
        project.setTitle(dto.getTitle().trim());
        project.setDescription(dto.getDescription().trim());
        // The service layer should set the student association before persisting.
        return project;
    }
}


