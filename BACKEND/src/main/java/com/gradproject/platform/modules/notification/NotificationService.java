package com.gradproject.platform.modules.notification;

import com.gradproject.platform.modules.notification.dto.NotificationResponseDTO;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationResponseDTO createNotification(User user, String title, String message, NotificationType type, String link) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("Notification user is required.");
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .link(StringUtils.hasText(link) ? link.trim() : null)
                .build();

        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void createNotifications(Collection<User> users, String title, String message, NotificationType type, String link) {
        if (users == null || users.isEmpty()) {
            return;
        }

        deduplicateUsers(users).values().forEach(user -> createNotification(user, title, message, type, link));
    }

    @Transactional
    public NotificationResponseDTO markAsRead(UUID notificationId) {
        User currentUser = requireCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

        if (!currentUser.getId().equals(notification.getUser().getId())) {
            throw new AccessDeniedException("You are not allowed to access this notification.");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }

        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = requireCurrentUser();
        Instant now = Instant.now();
        notificationRepository.findByUserIdAndReadAtIsNull(currentUser.getId())
                .forEach(notification -> notification.setReadAt(now));
    }

    @Transactional
    public long clearAll() {
        return notificationRepository.deleteByUserId(requireCurrentUser().getId());
    }

    @Transactional
    public long clearRead() {
        return notificationRepository.deleteByUserIdAndReadAtIsNotNull(requireCurrentUser().getId());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications() {
        User currentUser = requireCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByUserIdAndReadAtIsNull(requireCurrentUser().getId());
    }

    public NotificationResponseDTO toDto(Notification notification) {
        return new NotificationResponseDTO(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getReadAt() != null,
                notification.getReadAt(),
                notification.getLink(),
                notification.getCreatedAt(),
                notification.getUpdatedAt()
        );
    }

    private User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Current user not found.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new AccessDeniedException("Current user not found."));
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new AccessDeniedException("Current user not found."));
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Current user not found."));
    }

    private Map<UUID, User> deduplicateUsers(Collection<User> users) {
        Map<UUID, User> result = new LinkedHashMap<>();
        for (User user : users) {
            if (user != null && user.getId() != null) {
                result.putIfAbsent(user.getId(), user);
            }
        }
        return result;
    }
}
