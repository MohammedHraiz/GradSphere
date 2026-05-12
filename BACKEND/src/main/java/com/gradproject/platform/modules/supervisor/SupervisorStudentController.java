package com.gradproject.platform.modules.supervisor;

import com.gradproject.platform.modules.supervisor.dto.SupervisorStudentDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/supervisor")
public class SupervisorStudentController {

    private final SupervisorStudentService supervisorStudentService;

    public SupervisorStudentController(SupervisorStudentService supervisorStudentService) {
        this.supervisorStudentService = supervisorStudentService;
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping("/my-students")
    public ResponseEntity<List<SupervisorStudentDTO>> getMyStudents() {
        return ResponseEntity.ok(supervisorStudentService.getMyStudents());
    }
}
