package com.gradproject.platform.modules.task.dto;

import com.gradproject.platform.modules.task.TaskStatus;

public record TaskStatusUpdateRequestDTO(
        TaskStatus status
) {
}
