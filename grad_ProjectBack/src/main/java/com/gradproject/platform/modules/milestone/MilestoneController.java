package com.gradproject.platform.modules.milestone;

import com.gradproject.platform.modules.milestone.dto.MilestoneResponseDTO;
import com.gradproject.platform.modules.milestone.dto.MilestoneSubmissionRequestDTO;
import com.gradproject.platform.modules.milestone.dto.MilestoneUpsertRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR', 'DEAN_OFFICE', 'ADMIN')")
    @GetMapping("/projects/{projectId}/milestones")
    public ResponseEntity<List<MilestoneResponseDTO>> getProjectMilestones(@PathVariable UUID projectId) {
        return ResponseEntity.ok(milestoneService.getProjectMilestones(projectId));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @PostMapping("/projects/{projectId}/milestones")
    public ResponseEntity<MilestoneResponseDTO> createMilestone(@PathVariable UUID projectId, @RequestBody MilestoneUpsertRequestDTO request) {
        return ResponseEntity.ok(milestoneService.createMilestone(projectId, request));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @PatchMapping("/milestones/{milestoneId}")
    public ResponseEntity<MilestoneResponseDTO> updateMilestone(@PathVariable UUID milestoneId, @RequestBody MilestoneUpsertRequestDTO request) {
        return ResponseEntity.ok(milestoneService.updateMilestone(milestoneId, request));
    }

    @PreAuthorize("hasAnyRole('STUDENT', 'SUPERVISOR')")
    @DeleteMapping("/milestones/{milestoneId}")
    public ResponseEntity<Void> deleteMilestone(@PathVariable UUID milestoneId) {
        milestoneService.deleteMilestone(milestoneId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/milestones/{milestoneId}/submission")
    public ResponseEntity<MilestoneResponseDTO> submitMilestone(
            @PathVariable UUID milestoneId,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(milestoneService.submitMilestone(
                milestoneId,
                new MilestoneSubmissionRequestDTO(notes),
                file
        ));
    }
}
