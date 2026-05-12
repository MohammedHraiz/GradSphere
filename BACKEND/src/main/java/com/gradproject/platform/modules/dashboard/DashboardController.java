package com.gradproject.platform.modules.dashboard;

import com.gradproject.platform.modules.dashboard.dto.AdminDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.DeanDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.StudentDashboardDTO;
import com.gradproject.platform.modules.dashboard.dto.SupervisorDashboardDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student")
    public ResponseEntity<StudentDashboardDTO> studentDashboard() {
        return ResponseEntity.ok(dashboardService.getStudentDashboard());
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping("/supervisor")
    public ResponseEntity<SupervisorDashboardDTO> supervisorDashboard() {
        return ResponseEntity.ok(dashboardService.getSupervisorDashboard());
    }

    @PreAuthorize("hasRole('DEAN_OFFICE')")
    @GetMapping("/dean")
    public ResponseEntity<DeanDashboardDTO> deanDashboard() {
        return ResponseEntity.ok(dashboardService.getDeanDashboard());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<AdminDashboardDTO> adminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }
}
