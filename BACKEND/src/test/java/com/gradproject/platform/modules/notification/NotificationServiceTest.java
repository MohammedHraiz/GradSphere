package com.gradproject.platform.modules.notification;

import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;

    @InjectMocks NotificationService notificationService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void clearAllDeletesOnlyCurrentUserNotifications() {
        User user = user("student@example.com");
        authenticate(user);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(notificationRepository.deleteByUserId(user.getId())).thenReturn(2L);

        notificationService.clearAll();

        verify(notificationRepository).deleteByUserId(user.getId());
    }

    private static void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    private static User user(String email) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(UserRole.ROLE_STUDENT);
        return user;
    }
}
