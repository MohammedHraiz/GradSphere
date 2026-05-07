package com.gradproject.platform.modules.supervisorrequest;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.exception.InvitationAccessDeniedException;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMember;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.supervisorrequest.dto.SupervisorRequestDTO;
import com.gradproject.platform.modules.supervisorrequest.dto.SupervisorRequestMessageDTO;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SupervisorRequestService {

    private final SupervisorRequestRepository supervisorRequestRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    public SupervisorRequestService(
            SupervisorRequestRepository supervisorRequestRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            TeamMemberRepository teamMemberRepository) {
        this.supervisorRequestRepository = supervisorRequestRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Transactional
    public SupervisorRequestDTO requestSupervisor(UUID projectId, UUID supervisorId, SupervisorRequestMessageDTO request) {
        if (supervisorId == null) {
            throw new BadRequestException("Please select a supervisor.");
        }

        User currentUser = requireCurrentUser();
        TeamMember membership = teamMemberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Only team leader can request a supervisor."));

        if (!"LEADER".equals(membership.getMemberRole())) {
            throw new BadRequestException("Only team leader can request a supervisor.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));

        Team team = membership.getTeam();
        if (project.getTeam() == null || team == null || !team.getId().equals(project.getTeam().getId())) {
            throw new BadRequestException("Project does not belong to your team.");
        }

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Cannot request supervisor for archived project.");
        }

        if (project.getSupervisor() != null) {
            throw new BadRequestException("Project already has an assigned supervisor.");
        }

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new BadRequestException("Supervisor not found."));

        if (supervisor.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new BadRequestException("Selected user is not a supervisor.");
        }

        if (supervisorRequestRepository.existsByProjectIdAndSupervisorIdAndStatus(projectId, supervisorId, SupervisorRequestStatus.PENDING)) {
            throw new BadRequestException("You already requested this supervisor.");
        }

        if (supervisorRequestRepository.existsByProjectIdAndStatus(projectId, SupervisorRequestStatus.PENDING)) {
            throw new BadRequestException("This project already has a pending supervisor request.");
        }

        SupervisorRequest supervisorRequest = new SupervisorRequest();
        supervisorRequest.setProject(project);
        supervisorRequest.setTeam(team);
        supervisorRequest.setRequestedBy(currentUser);
        supervisorRequest.setSupervisor(supervisor);
        supervisorRequest.setStatus(SupervisorRequestStatus.PENDING);
        supervisorRequest.setMessage(request != null ? trimToNull(request.message()) : null);

        return toDto(supervisorRequestRepository.save(supervisorRequest));
    }

    @Transactional(readOnly = true)
    public List<SupervisorRequestDTO> getMyPendingRequests() {
        User currentUser = requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new InvitationAccessDeniedException("Only supervisors can view pending supervisor requests.");
        }

        return supervisorRequestRepository.findBySupervisorIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), SupervisorRequestStatus.PENDING)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupervisorRequestDTO> getAllRequests() {
        User currentUser = requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_DEAN_OFFICE && currentUser.getRole() != UserRole.ROLE_ADMIN) {
            throw new InvitationAccessDeniedException("Only dean office or admin can view supervisor requests.");
        }
        return supervisorRequestRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public SupervisorRequestDTO acceptRequest(UUID requestId) {
        User currentUser = requireSupervisor();
        SupervisorRequest supervisorRequest = supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Supervisor request not found."));

        if (supervisorRequest.getSupervisor() == null || !currentUser.getId().equals(supervisorRequest.getSupervisor().getId())) {
            throw new BadRequestException("This request is not assigned to you.");
        }

        if (supervisorRequest.getStatus() != SupervisorRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be accepted.");
        }

        Project project = supervisorRequest.getProject();
        if (project.getSupervisor() != null) {
            throw new BadRequestException("Project already has an assigned supervisor.");
        }

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Cannot accept request for archived project.");
        }

        project.setSupervisor(currentUser);
        if (project.getStatus() == ProjectStatus.SUBMITTED || project.getStatus() == ProjectStatus.PENDING) {
            project.setStatus(ProjectStatus.UNDER_REVIEW);
        }

        supervisorRequest.setStatus(SupervisorRequestStatus.ACCEPTED);
        supervisorRequest.setRespondedAt(Instant.now());

        supervisorRequestRepository.findByProjectIdAndStatus(project.getId(), SupervisorRequestStatus.PENDING)
                .stream()
                .filter(other -> !other.getId().equals(supervisorRequest.getId()))
                .forEach(other -> {
                    other.setStatus(SupervisorRequestStatus.CANCELED);
                    other.setRespondedAt(Instant.now());
                });

        projectRepository.save(project);
        return toDto(supervisorRequestRepository.save(supervisorRequest));
    }

    @Transactional
    public SupervisorRequestDTO rejectRequest(UUID requestId, SupervisorRequestMessageDTO request) {
        User currentUser = requireSupervisor();
        SupervisorRequest supervisorRequest = supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Supervisor request not found."));

        if (supervisorRequest.getSupervisor() == null || !currentUser.getId().equals(supervisorRequest.getSupervisor().getId())) {
            throw new BadRequestException("This request is not assigned to you.");
        }

        if (supervisorRequest.getStatus() != SupervisorRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be rejected.");
        }

        supervisorRequest.setStatus(SupervisorRequestStatus.REJECTED);
        supervisorRequest.setResponseMessage(request != null ? trimToNull(request.responseMessage()) : null);
        supervisorRequest.setRespondedAt(Instant.now());
        return toDto(supervisorRequestRepository.save(supervisorRequest));
    }

    @Transactional
    public SupervisorRequestDTO cancelRequest(UUID requestId) {
        User currentUser = requireCurrentUser();
        SupervisorRequest supervisorRequest = supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Supervisor request not found."));

        TeamMember membership = teamMemberRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Only team leader can cancel supervisor requests."));

        if (!"LEADER".equals(membership.getMemberRole())
                || supervisorRequest.getTeam() == null
                || membership.getTeam() == null
                || !membership.getTeam().getId().equals(supervisorRequest.getTeam().getId())) {
            throw new BadRequestException("Only team leader can cancel supervisor requests.");
        }

        if (supervisorRequest.getStatus() != SupervisorRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be canceled.");
        }

        supervisorRequest.setStatus(SupervisorRequestStatus.CANCELED);
        supervisorRequest.setRespondedAt(Instant.now());
        return toDto(supervisorRequestRepository.save(supervisorRequest));
    }

    public SupervisorRequestDTO toDto(SupervisorRequest supervisorRequest) {
        Project project = supervisorRequest.getProject();
        Team team = supervisorRequest.getTeam();
        User requestedBy = supervisorRequest.getRequestedBy();
        User supervisor = supervisorRequest.getSupervisor();
        return new SupervisorRequestDTO(
                supervisorRequest.getId(),
                project != null ? project.getId() : null,
                project != null ? project.getTitle() : null,
                project != null ? project.getDescription() : null,
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                requestedBy != null ? requestedBy.getName() : null,
                requestedBy != null ? requestedBy.getEmail() : null,
                supervisor != null ? supervisor.getId() : null,
                supervisor != null ? supervisor.getName() : null,
                supervisor != null ? supervisor.getEmail() : null,
                supervisorRequest.getStatus(),
                supervisorRequest.getMessage(),
                supervisorRequest.getResponseMessage(),
                supervisorRequest.getCreatedAt(),
                supervisorRequest.getRespondedAt()
        );
    }

    private User requireSupervisor() {
        User currentUser = requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new InvitationAccessDeniedException("Only supervisors can respond to supervisor requests.");
        }
        return currentUser;
    }

    private User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new InvitationAccessDeniedException("Current user not found");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId()).orElse(user);
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new InvitationAccessDeniedException("Current user not found"));
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new InvitationAccessDeniedException("Current user not found"));
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
