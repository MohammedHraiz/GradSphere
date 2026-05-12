package com.gradproject.platform.modules.meeting;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BulkDownloadService {

    private static final DateTimeFormatter FILE_NAME_DATE = DateTimeFormatter.ofPattern("yyyyMMdd_HHmm");

    private final MeetingRepository meetingRepository;
    private final PdfGeneratorService pdfGeneratorService;

    public byte[] downloadAllMeetingForms(UUID projectId, Authentication authentication) {
        List<Meeting> meetings = meetingRepository.findAllByProjectId(projectId);
        if (meetings.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "No meetings found for project " + projectId);
        }

        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             ZipOutputStream zipOutputStream = new ZipOutputStream(byteArrayOutputStream, StandardCharsets.UTF_8)) {

            for (Meeting meeting : meetings) {
                Resource pdfResource = pdfGeneratorService.generateMeetingForm(meeting.getId(), authentication);
                byte[] pdfBytes;
                try (InputStream inputStream = pdfResource.getInputStream()) {
                    pdfBytes = inputStream.readAllBytes();
                }

                String entryName = buildEntryName(meeting);
                ZipEntry zipEntry = new ZipEntry(entryName);
                zipOutputStream.putNextEntry(zipEntry);
                zipOutputStream.write(pdfBytes);
                zipOutputStream.closeEntry();
            }

            zipOutputStream.finish();
            return byteArrayOutputStream.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Could not create ZIP archive", ex);
        }
    }

    private String buildEntryName(Meeting meeting) {
        String datePart = meeting.getMeetingDate() != null ? meeting.getMeetingDate().format(FILE_NAME_DATE) : "UnknownDate";
        return "Meeting_" + datePart + "_" + meeting.getId() + ".pdf";
    }
}

