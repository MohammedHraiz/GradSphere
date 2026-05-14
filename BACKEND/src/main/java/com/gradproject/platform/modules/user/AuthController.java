package com.gradproject.platform.modules.user;

import com.gradproject.platform.modules.user.dto.*;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Random;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
//@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5177"})
public class AuthController {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, TeamMemberRepository teamMemberRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody OtpRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "EMAIL_NOT_FOUND"));
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        // FOR NOW: Check your IntelliJ Console to see the code!
        System.out.println(">>> OTP for " + request.email() + " is: " + otp);

        return ResponseEntity.ok(Map.of("message", "OTP_SENT_SUCCESSFULLY"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "EMAIL_NOT_FOUND"));
        }

        String otpValidationFailure = getOtpValidationFailure(user, request.otp());
        if (otpValidationFailure != null) {
            return ResponseEntity.status(400).body(Map.of("message", otpValidationFailure));
        }

        return ResponseEntity.ok(Map.of("message", "OTP_VERIFIED_SUCCESSFULLY"));
    }

    @PostMapping("/setup-password")
    public ResponseEntity<?> setupPassword(@RequestBody PasswordSetupRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "EMAIL_NOT_FOUND"));
        }

        String otpValidationFailure = getOtpValidationFailure(user, request.otp());
        if (otpValidationFailure != null) {
            return ResponseEntity.status(400).body(Map.of("message", otpValidationFailure));
        }

        // Hash password and clear OTP fields only after a final OTP check.
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "PASSWORD_SETUP_SUCCESS"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElse(null);

        // 1. Check if user exists
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "INVALID_CREDENTIALS"));
        }

        // 2. Check if password matches (BCrypt handles the comparison)
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "INVALID_CREDENTIALS"));
        }

        // 3. Success! For now, we return a simple success message.
        String token = jwtService.generateToken(user.getEmail(), new ArrayList<>(user.getAuthorities()));
        boolean hasTeam = teamMemberRepository.findByUserId(user.getId()).isPresent();
        return ResponseEntity.ok(Map.of(
                "message", "LOGIN_SUCCESS",
                "id", user.getId(),
                "userName", user.getName(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "hasTeam", hasTeam,
                "token", token
        ));
    }

    private String getOtpValidationFailure(User user, String otp) {
        if (user.getOtpCode() == null || otp == null || !user.getOtpCode().equals(otp)) {
            return "INVALID_OTP";
        }

        if (user.getOtpExpiresAt() == null || user.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            return "EXPIRED_OTP";
        }

        return null;
    }
}
