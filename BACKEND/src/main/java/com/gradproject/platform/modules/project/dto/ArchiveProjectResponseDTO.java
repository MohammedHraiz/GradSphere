package com.gradproject.platform.modules.project.dto;

import com.gradproject.platform.modules.project.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchiveProjectResponseDTO {
    private UUID projectId;
    private ProjectStatus projectStatus;
    private Instant archivedAt;
    private UUID archivedByAdminId;
    private List<GraduatedStudentDTO> graduatedStudents;
}

