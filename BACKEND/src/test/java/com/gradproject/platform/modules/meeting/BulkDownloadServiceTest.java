package com.gradproject.platform.modules.meeting;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BulkDownloadServiceTest {

    @Mock MeetingRepository meetingRepository;
    @Mock PdfGeneratorService pdfGeneratorService;

    @Test
    void downloadAllMeetingFormsIncludesOnlyCompletedMeetings() throws Exception {
        BulkDownloadService service = new BulkDownloadService(meetingRepository, pdfGeneratorService);
        UUID projectId = UUID.randomUUID();
        Meeting completedMeeting = meeting(MeetingStatus.COMPLETED);
        Meeting scheduledMeeting = meeting(MeetingStatus.SCHEDULED);
        Authentication authentication = new UsernamePasswordAuthenticationToken("dean@demo.local", null);

        when(meetingRepository.findAllByProjectId(projectId)).thenReturn(List.of(completedMeeting, scheduledMeeting));
        when(pdfGeneratorService.generateMeetingForm(completedMeeting.getId(), authentication))
                .thenReturn(new ByteArrayResource("pdf-bytes".getBytes()));

        byte[] zipBytes = service.downloadAllMeetingForms(projectId, authentication);

        assertThat(zipBytes).isNotEmpty();

        try (ZipInputStream zipInputStream = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            assertThat(zipInputStream.getNextEntry()).isNotNull();
            assertThat(zipInputStream.getNextEntry()).isNull();
        }

        verify(pdfGeneratorService).generateMeetingForm(completedMeeting.getId(), authentication);
        verify(pdfGeneratorService, never()).generateMeetingForm(scheduledMeeting.getId(), authentication);
    }

    @Test
    void downloadAllMeetingFormsRejectsProjectsWithoutCompletedMeetings() {
        BulkDownloadService service = new BulkDownloadService(meetingRepository, pdfGeneratorService);
        UUID projectId = UUID.randomUUID();
        Authentication authentication = new UsernamePasswordAuthenticationToken("dean@demo.local", null);

        when(meetingRepository.findAllByProjectId(projectId)).thenReturn(List.of(meeting(MeetingStatus.SCHEDULED)));

        assertThatThrownBy(() -> service.downloadAllMeetingForms(projectId, authentication))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND")
                .hasMessageContaining("No completed meeting reports found");
    }

    private static Meeting meeting(MeetingStatus status) {
        Meeting meeting = Meeting.builder()
                .title("Weekly sync")
                .meetingDate(LocalDateTime.of(2026, 5, 13, 10, 30))
                .status(status)
                .build();
        ReflectionTestUtils.setField(meeting, "id", UUID.randomUUID());
        return meeting;
    }
}
