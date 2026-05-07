package com.gradproject.platform.exception;

import com.gradproject.platform.dto.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fieldError -> fieldError.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<MessageResponse> handleResponseStatusException(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(new MessageResponse(exception.getReason()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<MessageResponse> handleBadRequest(BadRequestException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<MessageResponse> handleConstraintViolation(ConstraintViolationException exception) {
        String message = exception.getConstraintViolations().stream()
                .findFirst()
                .map(violation -> violation.getMessage())
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(message));
    }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<MessageResponse> handleDataIntegrityViolation(DataIntegrityViolationException exception) {
        String rawMessage = exception.getMostSpecificCause() != null
            ? exception.getMostSpecificCause().getMessage()
            : exception.getMessage();

        if (rawMessage != null
            && (rawMessage.contains("projects_team_id_key") || rawMessage.contains("projects_student_id_key"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Your team already has a submitted project."));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new MessageResponse("Request failed due to data constraints."));
        }

    @ExceptionHandler({FileStorageException.class, MaxUploadSizeExceededException.class, MultipartException.class})
    public ResponseEntity<MessageResponse> handleFileExceptions(Exception exception) {
        String message;

        if (exception instanceof MaxUploadSizeExceededException) {
            message = "Uploaded file exceeds the maximum allowed size of 10MB";
        } else if (exception instanceof MultipartException) {
            message = "Invalid multipart upload request";
        } else {
            message = exception.getMessage();
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(message));
    }

    @ExceptionHandler(MeetingNotFoundException.class)
    public ResponseEntity<MessageResponse> handleMeetingNotFound(MeetingNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(ProjectNotFoundException.class)
    public ResponseEntity<MessageResponse> handleProjectNotFound(ProjectNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(ProjectNotArchivableException.class)
    public ResponseEntity<MessageResponse> handleProjectNotArchivable(ProjectNotArchivableException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(InvitationAccessDeniedException.class)
    public ResponseEntity<MessageResponse> handleInvitationAccessDenied(InvitationAccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(InvitationConflictException.class)
    public ResponseEntity<MessageResponse> handleInvitationConflict(InvitationConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(InvitationNotFoundException.class)
    public ResponseEntity<MessageResponse> handleInvitationNotFound(InvitationNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("An unexpected error occurred."));
    }
}

