package com.gradproject.platform.exception;

import com.gradproject.platform.dto.MessageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    @Test
    void dataIntegrityViolationReturnsFriendlyMessage() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "duplicate key value violates unique constraint \"projects_team_id_key\""
        );

        ResponseEntity<MessageResponse> response = handler.handleDataIntegrityViolation(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Your team already has a submitted project.");
    }
}
