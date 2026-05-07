package com.gradproject.platform.modules.project.storage;

import com.gradproject.platform.exception.FileStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

    private final Path uploadDirectory;

    public FileStorageService(@Value("${app.storage.proposals-dir:./uploads/proposals}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(uploadDirectory);
            log.info("Proposal upload directory ready at {}", uploadDirectory);
        } catch (IOException ex) {
            throw new FileStorageException("Could not create upload directory", ex);
        }
    }

    public String storeProposal(MultipartFile file) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String sanitizedName = sanitizeFilename(originalFilename);
        String storedFileName = appendUuidToFilename(sanitizedName);

        Path targetLocation = uploadDirectory.resolve(storedFileName).normalize();
        if (!targetLocation.startsWith(uploadDirectory)) {
            throw new FileStorageException("Invalid file storage path");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileStorageException("Could not store proposal file", ex);
        }

        log.info("Stored proposal file {} as {}", originalFilename, targetLocation);
        return "/files/" + storedFileName;
    }

    public Resource loadAsResource(String storedFileName) {
        try {
            Path filePath = uploadDirectory.resolve(storedFileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileStorageException("File not found: " + storedFileName);
        } catch (MalformedURLException ex) {
            throw new FileStorageException("Could not read file: " + storedFileName, ex);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Proposal file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("Proposal file must not exceed 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename)) {
            throw new FileStorageException("Proposal file name is required");
        }

        String normalizedFilename = StringUtils.cleanPath(originalFilename).toLowerCase(Locale.ROOT);
        if (!normalizedFilename.endsWith(".pdf")) {
            throw new FileStorageException("Proposal file must be a PDF.");
        }
    }

    private String sanitizeFilename(String filename) {
        String strippedName = Paths.get(filename).getFileName().toString();
        int dotIndex = strippedName.lastIndexOf('.');
        String baseName = dotIndex > 0 ? strippedName.substring(0, dotIndex) : strippedName;
        String extension = dotIndex > 0 ? strippedName.substring(dotIndex).toLowerCase(Locale.ROOT) : "";
        String safeBaseName = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");

        if (!StringUtils.hasText(safeBaseName)) {
            safeBaseName = "proposal";
        }

        return safeBaseName + "_" + UUID.randomUUID() + extension;
    }

    private String appendUuidToFilename(String filename) {
        return filename;
    }
}

