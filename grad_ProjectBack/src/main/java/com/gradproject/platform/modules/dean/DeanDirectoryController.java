package com.gradproject.platform.modules.dean;

import com.gradproject.platform.modules.dean.dto.DirectoryStudentDTO;
import com.gradproject.platform.modules.dean.dto.DirectorySupervisorDTO;
import com.gradproject.platform.modules.dean.dto.DirectoryTeamDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/dean", "/api/v1/admin"})
@PreAuthorize("hasAnyRole('DEAN_OFFICE', 'ADMIN')")
public class DeanDirectoryController {

    private final DeanDirectoryService deanDirectoryService;

    public DeanDirectoryController(DeanDirectoryService deanDirectoryService) {
        this.deanDirectoryService = deanDirectoryService;
    }

    @GetMapping("/supervisors")
    public ResponseEntity<List<DirectorySupervisorDTO>> getSupervisors() {
        return ResponseEntity.ok(deanDirectoryService.getSupervisors());
    }

    @GetMapping("/teams")
    public ResponseEntity<List<DirectoryTeamDTO>> getTeams() {
        return ResponseEntity.ok(deanDirectoryService.getTeams());
    }

    @GetMapping("/students")
    public ResponseEntity<List<DirectoryStudentDTO>> getStudents() {
        return ResponseEntity.ok(deanDirectoryService.getStudents());
    }
}
