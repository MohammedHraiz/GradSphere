package com.gradproject.platform.modules.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping({"/api/v1/student", "/api/v1/users/students"})
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<StudentDTO>> searchStudents(@RequestParam(name = "query") String query, Principal principal) {
        List<StudentDTO> results = studentService.searchEligibleInvitationStudents(query, principal.getName());
        return ResponseEntity.ok(results);
    }

}


