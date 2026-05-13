package com.gradproject.platform.modules.admin.importer;

import com.gradproject.platform.modules.admin.importer.dto.ImportConfirmRequestDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportPreviewDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportResultDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportStudentRowDTO;
import com.gradproject.platform.modules.user.UserDepartment;
import com.gradproject.platform.modules.user.UserManagementService;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.dto.UserProfileResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserImportServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserManagementService userManagementService;

    @Mock
    private StudentPdfImportParser parser;

    private UserImportService service;

    @BeforeEach
    void setUp() {
        service = new UserImportService(userRepository, userManagementService, parser);
    }

    @Test
    void previewDoesNotCreateUsers() {
        when(parser.parse(any())).thenReturn(new StudentPdfImportParser.ParsedStudentBatch(
                UserDepartment.COMPUTER_SCIENCE,
                List.of(new StudentPdfImportParser.ParsedStudentRow(1, "أحمد محمد", "32201001145"))
        ));

        MockMultipartFile file = new MockMultipartFile("file", "students.pdf", "application/pdf", new byte[]{1});
        ImportPreviewDTO preview = service.previewStudentPdf(file);

        assertThat(preview.totalRows()).isEqualTo(1);
        verifyNoInteractions(userManagementService);
    }

    @Test
    void duplicateUniversityIdIsDetected() {
        when(parser.parse(any())).thenReturn(new StudentPdfImportParser.ParsedStudentBatch(
                UserDepartment.COMPUTER_SCIENCE,
                List.of(
                        new StudentPdfImportParser.ParsedStudentRow(1, "أحمد محمد", "32201001145"),
                        new StudentPdfImportParser.ParsedStudentRow(2, "ليلى علي", "32201001145")
                )
        ));

        MockMultipartFile file = new MockMultipartFile("file", "students.pdf", "application/pdf", new byte[]{1});
        ImportPreviewDTO preview = service.previewStudentPdf(file);

        assertThat(preview.duplicatesInFile()).isEqualTo(2);
        assertThat(preview.rows()).allMatch(row -> row.status() == ImportRowStatus.DUPLICATE_IN_FILE);
    }

    @Test
    void existingUserIsMarkedAlreadyExists() {
        when(parser.parse(any())).thenReturn(new StudentPdfImportParser.ParsedStudentBatch(
                UserDepartment.COMPUTER_SCIENCE,
                List.of(new StudentPdfImportParser.ParsedStudentRow(1, "أحمد محمد", "32201001145"))
        ));
        when(userRepository.existsByUniversityIdIgnoreCase("32201001145")).thenReturn(true);

        MockMultipartFile file = new MockMultipartFile("file", "students.pdf", "application/pdf", new byte[]{1});
        ImportPreviewDTO preview = service.previewStudentPdf(file);

        assertThat(preview.existingUsers()).isEqualTo(1);
        assertThat(preview.rows().get(0).status()).isEqualTo(ImportRowStatus.ALREADY_EXISTS);
    }

    @Test
    void emailIsGeneratedFromUniversityId() {
        when(parser.parse(any())).thenReturn(new StudentPdfImportParser.ParsedStudentBatch(
                UserDepartment.COMPUTER_SCIENCE,
                List.of(new StudentPdfImportParser.ParsedStudentRow(1, "أحمد محمد", "32201001145"))
        ));

        MockMultipartFile file = new MockMultipartFile("file", "students.pdf", "application/pdf", new byte[]{1});
        ImportPreviewDTO preview = service.previewStudentPdf(file);

        assertThat(preview.rows().get(0).generatedEmail()).isEqualTo("32201001145@std.bau.edu.jo");
    }

    @Test
    void confirmCreatesOnlyValidUsers() {
        ImportStudentRowDTO validRow = new ImportStudentRowDTO(
                1,
                "أحمد محمد",
                "32201001145",
                null,
                "COMPUTER_SCIENCE",
                "ROLE_STUDENT",
                null,
                List.of()
        );
        ImportStudentRowDTO invalidRow = new ImportStudentRowDTO(
                2,
                "",
                "",
                null,
                "COMPUTER_SCIENCE",
                "ROLE_STUDENT",
                null,
                List.of()
        );

        when(userRepository.existsByUniversityIdIgnoreCase("32201001145")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("32201001145@std.bau.edu.jo")).thenReturn(false);
        when(userManagementService.createUser(any())).thenReturn(userProfile("32201001145@std.bau.edu.jo"));

        ImportConfirmRequestDTO request = new ImportConfirmRequestDTO(List.of(validRow, invalidRow), null, true);
        ImportResultDTO result = service.confirmStudentPdfImport(request);

        assertThat(result.createdCount()).isEqualTo(1);
        assertThat(result.skippedCount()).isEqualTo(1);
        verify(userManagementService, times(1)).createUser(any());
    }

    private UserProfileResponseDTO userProfile(String email) {
        return new UserProfileResponseDTO(
                UUID.randomUUID(),
                "Student",
                email,
                "32201001145",
                "ROLE_STUDENT",
                "COMPUTER_SCIENCE",
                null,
                null,
                null,
                null,
                Instant.now(),
                false
        );
    }
}
