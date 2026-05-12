package com.gradproject.platform.modules.project;

import com.gradproject.platform.modules.project.comment.ProjectComment;
import com.gradproject.platform.modules.project.dto.FeedbackRequestDTO;

public final class ProjectCommentMapper {

    private ProjectCommentMapper() {
    }

    public static ProjectComment toEntity(FeedbackRequestDTO dto) {
        return ProjectComment.builder()
                .content(dto.getComment() == null ? null : dto.getComment().trim())
                .statusAtTime(dto.getNewStatus())
                .build();
    }
}

