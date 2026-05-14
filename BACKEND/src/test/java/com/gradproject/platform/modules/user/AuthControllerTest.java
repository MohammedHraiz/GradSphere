package com.gradproject.platform.modules.user;

import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.user.dto.OtpVerificationRequest;
import com.gradproject.platform.modules.user.dto.PasswordSetupRequest;
import com.gradproject.platform.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(userRepository, teamMemberRepository, passwordEncoder, jwtService);
    }

    @Test
    void verifyOtpReturnsSuccessWhenCodeMatchesAndIsNotExpired() {
        User user = userWithOtp("student@bau.edu", "123456", LocalDateTime.now().plusMinutes(5));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.verifyOtp(new OtpVerificationRequest(user.getEmail(), "123456"));

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isEqualTo(Map.of("message", "OTP_VERIFIED_SUCCESSFULLY"));
    }

    @Test
    void verifyOtpRejectsExpiredCode() {
        User user = userWithOtp("student@bau.edu", "123456", LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.verifyOtp(new OtpVerificationRequest(user.getEmail(), "123456"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isEqualTo(Map.of("message", "EXPIRED_OTP"));
    }

    @Test
    void setupPasswordStillRequiresOtpAndClearsOtpFieldsOnSuccess() {
        User user = userWithOtp("student@bau.edu", "654321", LocalDateTime.now().plusMinutes(5));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("StrongPass!1")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = controller.setupPassword(
                new PasswordSetupRequest(user.getEmail(), "654321", "StrongPass!1")
        );

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isEqualTo(Map.of("message", "PASSWORD_SETUP_SUCCESS"));
        assertThat(user.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(user.getOtpCode()).isNull();
        assertThat(user.getOtpExpiresAt()).isNull();
        verify(userRepository).save(user);
    }

    private static User userWithOtp(String email, String otp, LocalDateTime expiresAt) {
        User user = new User();
        user.setEmail(email);
        user.setName("Student");
        user.setPasswordHash("old-password");
        user.setRole(UserRole.ROLE_STUDENT);
        user.setOtpCode(otp);
        user.setOtpExpiresAt(expiresAt);
        return user;
    }
}
