package com.gradproject.platform.exception;

import com.gradproject.platform.dto.MessageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

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

    @Test
    void unreadableRequestBodyReturnsBadRequestMessage() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        HttpInputMessage inputMessage = new HttpInputMessage() {
            @Override
            public InputStream getBody() {
                return new ByteArrayInputStream(new byte[0]);
            }

            @Override
            public HttpHeaders getHeaders() {
                return HttpHeaders.EMPTY;
            }
        };
        HttpMessageNotReadableException exception = new HttpMessageNotReadableException(
                "Required request body is missing",
                inputMessage
        );

        ResponseEntity<MessageResponse> response = handler.handleHttpMessageNotReadable(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Request body is missing.");
    }
}
