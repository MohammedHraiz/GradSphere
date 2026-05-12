package com.gradproject.platform.modules.notification;

import com.gradproject.platform.dto.MessageResponse;
import com.gradproject.platform.modules.notification.dto.NotificationResponseDTO;
import com.gradproject.platform.modules.notification.dto.NotificationUnreadCountDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationUnreadCountDTO> getUnreadCount() {
        return ResponseEntity.ok(new NotificationUnreadCountDTO(notificationService.getUnreadCount()));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationResponseDTO> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read."));
    }

    @DeleteMapping("/clear-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> clearAll() {
        long cleared = notificationService.clearAll();
        return ResponseEntity.ok(new MessageResponse("Cleared " + cleared + " notifications."));
    }

    @DeleteMapping("/clear-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> clearRead() {
        long cleared = notificationService.clearRead();
        return ResponseEntity.ok(new MessageResponse("Cleared " + cleared + " read notifications."));
    }
}
