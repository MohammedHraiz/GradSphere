package com.gradproject.platform.modules.user;

import com.gradproject.platform.modules.invitation.InvitationService;
import com.gradproject.platform.modules.invitation.dto.InviteEligibility;
import com.gradproject.platform.modules.team.Team;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvitationService invitationService;

    @Test
    void searchResultsMatchSendInviteEligibility() {
        User currentUser = user(UUID.randomUUID(), "leader@example.com");
        UUID candidateId = UUID.randomUUID();
        StudentDTO candidate = new StudentDTO(candidateId, "Student One", "Student", "One", "student@example.com", "S-001");

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(studentRepository.searchStudents("student", UserRole.ROLE_STUDENT)).thenReturn(List.of(candidate));
        when(invitationService.getInviteEligibility(candidateId, currentUser))
                .thenReturn(InviteEligibility.ineligible("Student already has a pending invitation.", null, team(UUID.randomUUID(), currentUser)));

        List<StudentDTO> results = new StudentService(studentRepository, userRepository, invitationService)
                .searchEligibleInvitationStudents("student", currentUser.getEmail());

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(candidateId);
        assertThat(results.get(0).isEligible()).isFalse();
        assertThat(results.get(0).getReason()).isEqualTo("Student already has a pending invitation.");
    }

    private static User user(UUID id, String email) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail(email);
        user.setName(email);
        user.setPasswordHash("secret");
        user.setRole(UserRole.ROLE_STUDENT);
        return user;
    }

    private static Team team(UUID id, User leader) {
        Team team = new Team();
        ReflectionTestUtils.setField(team, "id", id);
        team.setName("Team A");
        team.setMaxSize(5);
        team.setLeader(leader);
        return team;
    }
}
