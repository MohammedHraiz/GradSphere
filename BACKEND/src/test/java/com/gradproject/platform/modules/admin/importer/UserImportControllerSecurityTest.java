package com.gradproject.platform.modules.admin.importer;

import com.gradproject.platform.modules.admin.importer.dto.ImportConfirmRequestDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportPreviewDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportResultDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(UserImportControllerSecurityTest.TestConfig.class)
class UserImportControllerSecurityTest {

    @Autowired
    private UserImportController controller;

    @Autowired
    private UserImportService userImportService;

    @Test
    @WithMockUser(roles = "STUDENT")
    void previewRequiresAdminRole() {
        MockMultipartFile file = new MockMultipartFile("file", "students.pdf", "application/pdf", new byte[]{1});

        assertThatThrownBy(() -> controller.previewStudentPdf(file))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void previewAllowsAdmin() {
        MockMultipartFile file = new MockMultipartFile("file", "students.pdf", "application/pdf", new byte[]{1});
        when(userImportService.previewStudentPdf(any())).thenReturn(new ImportPreviewDTO(
                "COMPUTER_SCIENCE",
                "Computer Science",
                0,
                0,
                0,
                0,
                0,
                List.of()
        ));

        ResponseEntity<ImportPreviewDTO> response = controller.previewStudentPdf(file);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void confirmRequiresAdminRole() {
        ImportConfirmRequestDTO request = new ImportConfirmRequestDTO(List.of(), null, true);

        assertThatThrownBy(() -> controller.confirmStudentPdfImport(request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void confirmAllowsAdmin() {
        ImportConfirmRequestDTO request = new ImportConfirmRequestDTO(List.of(), null, true);
        when(userImportService.confirmStudentPdfImport(any())).thenReturn(new ImportResultDTO(
                0,
                0,
                0,
                List.of(),
                List.of(),
                List.of()
        ));

        ResponseEntity<ImportResultDTO> response = controller.confirmStudentPdfImport(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Configuration
    @EnableMethodSecurity
    static class TestConfig {

        @Bean
        UserImportController userImportController(UserImportService userImportService) {
            return new UserImportController(userImportService);
        }

        @Bean
        UserImportService userImportService() {
            return mock(UserImportService.class);
        }
    }
}
