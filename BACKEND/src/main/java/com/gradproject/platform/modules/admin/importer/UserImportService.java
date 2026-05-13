package com.gradproject.platform.modules.admin.importer;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.admin.importer.dto.ImportConfirmRequestDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportPreviewDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportResultDTO;
import com.gradproject.platform.modules.admin.importer.dto.ImportStudentRowDTO;
import com.gradproject.platform.modules.user.UserDepartment;
import com.gradproject.platform.modules.user.UserManagementService;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import com.gradproject.platform.modules.user.dto.AdminUserCreateRequestDTO;
import com.gradproject.platform.modules.user.dto.UserProfileResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class UserImportService {

    private static final String STUDENT_DOMAIN = "@std.bau.edu.jo";

    private final UserRepository userRepository;
    private final UserManagementService userManagementService;
    private final StudentPdfImportParser parser;

    public UserImportService(UserRepository userRepository, UserManagementService userManagementService, StudentPdfImportParser parser) {
        this.userRepository = userRepository;
        this.userManagementService = userManagementService;
        this.parser = parser;
    }

    public ImportPreviewDTO previewStudentPdf(MultipartFile file) {
        StudentPdfImportParser.ParsedStudentBatch parsed = parser.parse(file);
        String detectedDepartment = parsed.department() != null ? parsed.department().name() : null;
        String detectedDepartmentLabel = parsed.department() != null ? formatDepartmentLabel(parsed.department()) : null;

        List<ImportStudentRowDTO> baseRows = parsed.rows().stream()
            .map(row -> {
                String normalizedId = normalizeUniversityId(row.universityId());
                return new ImportStudentRowDTO(
                    row.rowNumber(),
                    row.name(),
                    normalizedId,
                    generateEmail(normalizedId),
                    detectedDepartment,
                    UserRole.ROLE_STUDENT.name(),
                    ImportRowStatus.INVALID,
                    List.of()
                );
            })
            .toList();

        ValidationResult validation = validateRows(baseRows, null);

        return new ImportPreviewDTO(
                detectedDepartment,
                detectedDepartmentLabel,
                validation.totalRows,
                validation.validRows,
                validation.invalidRows,
                validation.duplicatesInFile,
                validation.existingUsers,
                validation.rows
        );
    }

    public ImportResultDTO confirmStudentPdfImport(ImportConfirmRequestDTO request) {
        if (request == null || request.rows() == null || request.rows().isEmpty()) {
            throw new BadRequestException("Import rows are required.");
        }

        String departmentOverride = normalizeDepartmentOverride(request.departmentOverride());
        boolean skipInvalid = request.skipInvalid() == null || request.skipInvalid();

        ValidationResult validation = validateRows(request.rows(), departmentOverride);

        boolean hasInvalidRows = validation.rows.stream().anyMatch(row -> row.status() != ImportRowStatus.VALID);
        if (!skipInvalid && hasInvalidRows) {
            throw new BadRequestException("Some rows are invalid. Review the preview or enable skipInvalid.");
        }

        List<UserProfileResponseDTO> createdUsers = new ArrayList<>();
        List<ImportStudentRowDTO> skippedRows = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int failedCount = 0;

        for (ImportStudentRowDTO row : validation.rows) {
            if (row.status() != ImportRowStatus.VALID) {
                skippedRows.add(row);
                continue;
            }

            try {
                createdUsers.add(userManagementService.createUser(toCreateRequest(row)));
            } catch (BadRequestException exception) {
                String message = exception.getMessage();
                if ("Email already exists.".equals(message) || "University ID already exists.".equals(message)) {
                    skippedRows.add(withStatus(row, ImportRowStatus.ALREADY_EXISTS, List.of("User already exists.")));
                } else {
                    failedCount += 1;
                    errors.add("Row " + row.rowNumber() + ": " + message);
                }
            } catch (Exception exception) {
                failedCount += 1;
                errors.add("Row " + row.rowNumber() + ": " + exception.getMessage());
            }
        }

        return new ImportResultDTO(
                createdUsers.size(),
                skippedRows.size(),
                failedCount,
                createdUsers,
                skippedRows,
                errors
        );
    }

    private ValidationResult validateRows(List<ImportStudentRowDTO> rows, String departmentOverride) {
        List<ImportStudentRowDTO> validated = new ArrayList<>();
        if (rows == null || rows.isEmpty()) {
            return new ValidationResult(validated, 0, 0, 0, 0, 0);
        }

        Map<String, Integer> idCounts = new HashMap<>();
        Map<String, Integer> emailCounts = new HashMap<>();

        for (ImportStudentRowDTO row : rows) {
            String universityId = normalizeUniversityId(row.universityId());
            if (hasText(universityId)) {
                idCounts.put(universityId, idCounts.getOrDefault(universityId, 0) + 1);
                String email = generateEmail(universityId);
                if (hasText(email)) {
                    emailCounts.put(email, emailCounts.getOrDefault(email, 0) + 1);
                }
            }
        }

        for (ImportStudentRowDTO row : rows) {
            String name = clean(row.name());
            String universityId = normalizeUniversityId(row.universityId());
            String email = generateEmail(universityId);
            String department = resolveDepartment(row.department(), departmentOverride);
            List<String> errors = new ArrayList<>();

            boolean missingName = !hasText(name);
            if (missingName) {
                errors.add("Name is required.");
            }

            boolean missingUniversityId = !hasText(universityId);
            if (missingUniversityId) {
                errors.add("University ID is required.");
            }

            boolean invalidUniversityId = hasText(universityId) && !universityId.matches("\\d+");
            if (invalidUniversityId) {
                errors.add("University ID must be numeric.");
            }

            boolean invalidLength = hasText(universityId)
                    && universityId.matches("\\d+")
                    && !(universityId.length() == 10 || universityId.length() == 11);
            if (invalidLength) {
                errors.add("University ID must be 10 or 11 digits.");
            }

            boolean departmentRequired = !hasText(department);
            if (departmentRequired) {
                errors.add("Department is required.");
            }

            boolean duplicateId = hasText(universityId) && idCounts.getOrDefault(universityId, 0) > 1;
            boolean duplicateEmail = hasText(email) && emailCounts.getOrDefault(email, 0) > 1;

            if (duplicateId) {
                errors.add("Duplicate university ID in file.");
            }
            if (duplicateEmail) {
                errors.add("Duplicate email in file.");
            }

            boolean existingUser = false;
            if (!missingUniversityId && !invalidUniversityId && !invalidLength) {
                existingUser = userRepository.existsByUniversityIdIgnoreCase(universityId);
            }
            if (!existingUser && hasText(email)) {
                existingUser = userRepository.existsByEmailIgnoreCase(email);
            }

            if (existingUser) {
                errors.add("User already exists.");
            }

            boolean hasCoreErrors = missingName || missingUniversityId || invalidUniversityId || invalidLength || departmentRequired;
            ImportRowStatus status;

            if (hasCoreErrors) {
                status = ImportRowStatus.INVALID;
            } else if (duplicateId || duplicateEmail) {
                status = ImportRowStatus.DUPLICATE_IN_FILE;
            } else if (existingUser) {
                status = ImportRowStatus.ALREADY_EXISTS;
            } else {
                status = ImportRowStatus.VALID;
            }

            validated.add(new ImportStudentRowDTO(
                    row.rowNumber() > 0 ? row.rowNumber() : validated.size() + 1,
                    name,
                    universityId,
                    email,
                    department,
                    UserRole.ROLE_STUDENT.name(),
                    status,
                    errors
            ));
        }

        int validRows = (int) validated.stream().filter(row -> row.status() == ImportRowStatus.VALID).count();
        int invalidRows = (int) validated.stream().filter(row -> row.status() == ImportRowStatus.INVALID).count();
        int duplicates = (int) validated.stream().filter(row -> row.status() == ImportRowStatus.DUPLICATE_IN_FILE).count();
        int existing = (int) validated.stream().filter(row -> row.status() == ImportRowStatus.ALREADY_EXISTS).count();

        return new ValidationResult(validated, validated.size(), validRows, invalidRows, duplicates, existing);
    }

    private String resolveDepartment(String rowDepartment, String override) {
        if (hasText(override)) {
            return override;
        }
        return normalizeDepartmentOverride(rowDepartment);
    }

    private String normalizeDepartmentOverride(String value) {
        if (!hasText(value)) {
            return null;
        }

        String trimmed = value.trim().toUpperCase(Locale.ROOT);
        try {
            return UserDepartment.valueOf(trimmed).name();
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid department.");
        }
    }

    private String formatDepartmentLabel(UserDepartment department) {
        return switch (department) {
            case COMPUTER_SCIENCE -> "Computer Science";
            case COMPUTER_INFORMATION_SCIENCE -> "Computer Information Science";
            case SOFTWARE_ENGINEERING -> "Software Engineering";
            case ANIMATION -> "Animation";
        };
    }

    private AdminUserCreateRequestDTO toCreateRequest(ImportStudentRowDTO row) {
        AdminUserCreateRequestDTO request = new AdminUserCreateRequestDTO();
        request.setName(row.name());
        request.setEmail(row.generatedEmail());
        request.setUniversityId(row.universityId());
        request.setRole(UserRole.ROLE_STUDENT.name());
        request.setDepartment(row.department());
        return request;
    }

    private ImportStudentRowDTO withStatus(ImportStudentRowDTO row, ImportRowStatus status, List<String> errors) {
        List<String> merged = new ArrayList<>(row.errors() != null ? row.errors() : List.of());
        merged.addAll(errors);
        return new ImportStudentRowDTO(
                row.rowNumber(),
                row.name(),
                row.universityId(),
                row.generatedEmail(),
                row.department(),
                row.role(),
                status,
                merged
        );
    }

    private String generateEmail(String universityId) {
        if (!hasText(universityId)) {
            return null;
        }
        return universityId + STUDENT_DOMAIN;
    }

    private String normalizeUniversityId(String value) {
        return clean(value);
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record ValidationResult(
            List<ImportStudentRowDTO> rows,
            int totalRows,
            int validRows,
            int invalidRows,
            int duplicatesInFile,
            int existingUsers
    ) {
    }
}
