package com.gradproject.platform.modules.user;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.invitation.InvitationService;
import com.gradproject.platform.modules.invitation.dto.InviteEligibility;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final InvitationService invitationService;

    public StudentService(StudentRepository studentRepository, UserRepository userRepository, InvitationService invitationService) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.invitationService = invitationService;
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> searchStudents(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String trimmed = query.trim();
        return studentRepository.searchStudents(trimmed, UserRole.ROLE_STUDENT);
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> searchEligibleInvitationStudents(String query, String currentUserEmail) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));

        return studentRepository.searchStudents(query.trim(), UserRole.ROLE_STUDENT)
                .stream()
                .map(student -> applyInviteEligibility(student, currentUser))
                .toList();
    }

    private StudentDTO applyInviteEligibility(StudentDTO student, User currentUser) {
        InviteEligibility eligibility = invitationService.getInviteEligibility(student.getId(), currentUser);
        student.setEligible(eligibility.isEligible());
        student.setReason(eligibility.getReason());
        student.setHasTeam("Student is already in a team.".equals(eligibility.getReason()));
        return student;
    }

}


