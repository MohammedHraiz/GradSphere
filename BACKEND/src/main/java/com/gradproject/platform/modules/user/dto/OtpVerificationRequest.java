package com.gradproject.platform.modules.user.dto;

public record OtpVerificationRequest(
        String email,
        String otp
) {}
