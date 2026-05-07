package com.gradproject.platform.modules.project.dto;

import com.gradproject.platform.modules.project.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.AssertTrue;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequestDTO {

    @Size(max = 2000, message = "Comment must be 2000 characters or less")
    private String comment;

    @NotNull(message = "New status is required")
    private ProjectStatus newStatus;

    @AssertTrue(message = "Comment is required when status is REVISION_REQUIRED")
    public boolean isCommentPresentWhenRevisionRequired() {
        return (newStatus != ProjectStatus.REVISION_REQUIRED && newStatus != ProjectStatus.NEEDS_CHANGES)
                || (comment != null && !comment.trim().isEmpty());
    }
}

