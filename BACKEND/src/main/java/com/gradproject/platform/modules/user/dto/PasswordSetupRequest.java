package com.gradproject.platform.modules.user.dto;

public record PasswordSetupRequest(
        String email,
        String otp,
        String password
) {}