package com.gradproject.platform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ProjectNotArchivableException extends RuntimeException {
    public ProjectNotArchivableException(String message) {
        super(message);
    }
}

