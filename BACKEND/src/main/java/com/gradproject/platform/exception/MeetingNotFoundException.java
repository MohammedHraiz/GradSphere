package com.gradproject.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.UUID;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class MeetingNotFoundException extends RuntimeException {

    public MeetingNotFoundException(UUID meetingId) {
        super("Meeting not found: " + meetingId);
    }
}

