package com.gradproject.platform.modules.notification.dto;

import com.gradproject.platform.modules.notification.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponseDTO(
        UUID id,
        String title,
        String message,
        NotificationType type,
        boolean read,
        Instant readAt,
        String link,
        Instant createdAt,
        Instant updatedAt
) {
}
