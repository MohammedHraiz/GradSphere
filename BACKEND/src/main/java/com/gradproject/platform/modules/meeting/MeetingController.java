package com.gradproject.platform.modules.meeting;

import com.gradproject.platform.dto.MessageResponse;
import com.gradproject.platform.modules.meeting.dto.MeetingCompletionDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingDraftDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingResponseDTO;
import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;
    private final PdfGeneratorService pdfGeneratorService;

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/projects/{projectId}/meetings")
    public ResponseEntity<List<MeetingResponseDTO>> getProjectMeetings(@PathVariable UUID projectId) {
        return ResponseEntity.ok(meetingService.getProjectMeetings(projectId));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/meetings/my")
    public ResponseEntity<List<MeetingResponseDTO>> getMyMeetings() {
        return ResponseEntity.ok(meetingService.getMyMeetings());
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping("/meetings/supervisor")
    public ResponseEntity<List<MeetingResponseDTO>> getSupervisorMeetings() {
        return ResponseEntity.ok(meetingService.getSupervisorMeetings());
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PostMapping("/projects/{projectId}/meetings")
    public ResponseEntity<MeetingResponseDTO> createMeeting(@PathVariable UUID projectId, @Valid @RequestBody MeetingDraftDTO request) {
        return ResponseEntity.ok(meetingService.createMeeting(projectId, request));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/projects/{projectId}/meetings/request")
    public ResponseEntity<MeetingResponseDTO> requestMeeting(@PathVariable UUID projectId, @Valid @RequestBody MeetingDraftDTO request) {
        return ResponseEntity.ok(meetingService.requestMeeting(projectId, request));
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PutMapping("/meetings/{meetingId}")
    public ResponseEntity<MeetingResponseDTO> updateMeeting(@PathVariable UUID meetingId, @Valid @RequestBody MeetingDraftDTO request) {
        return ResponseEntity.ok(meetingService.updateMeeting(meetingId, request));
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PatchMapping("/meetings/{meetingId}/approve")
    public ResponseEntity<MeetingResponseDTO> approveMeeting(@PathVariable UUID meetingId, @Valid @RequestBody(required = false) MeetingDraftDTO request) {
        return ResponseEntity.ok(meetingService.approveMeetingRequest(meetingId, request));
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PatchMapping("/meetings/{meetingId}/reject")
    public ResponseEntity<MeetingResponseDTO> rejectMeeting(@PathVariable UUID meetingId, @RequestBody(required = false) Map<String, String> request) {
        return ResponseEntity.ok(meetingService.rejectMeetingRequest(meetingId, request != null ? request.get("reason") : null));
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PatchMapping("/meetings/{meetingId}/complete")
    public ResponseEntity<MeetingResponseDTO> completeMeeting(@PathVariable UUID meetingId, @Valid @RequestBody MeetingCompletionDTO request) {
        return ResponseEntity.ok(meetingService.completeMeeting(meetingId, request));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @PatchMapping("/meetings/{meetingId}/cancel")
    public ResponseEntity<MeetingResponseDTO> cancelMeeting(@PathVariable UUID meetingId) {
        return ResponseEntity.ok(meetingService.cancelMeeting(meetingId));
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @DeleteMapping("/meetings/{meetingId}")
    public ResponseEntity<MessageResponse> deleteMeeting(@PathVariable UUID meetingId) {
        meetingService.deleteMeeting(meetingId);
        return ResponseEntity.ok(new MessageResponse("Meeting deleted successfully."));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/meetings/{id}/download-form")
    public ResponseEntity<Resource> downloadForm(@PathVariable UUID id, Authentication authentication) {
        Resource pdf = pdfGeneratorService.generateMeetingForm(id, authentication);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Project-Meeting-Attendance-Progress-Form.pdf\"")
                .body(pdf);
    }
}


