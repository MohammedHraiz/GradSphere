package com.gradproject.platform.modules.meeting;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.exception.MeetingNotFoundException;
import com.gradproject.platform.modules.notification.NotificationService;
import com.gradproject.platform.modules.notification.NotificationType;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.project.ProjectRepository;
import com.gradproject.platform.modules.project.ProjectStatus;
import com.gradproject.platform.modules.project.member.TeamMemberRepository;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import com.gradproject.platform.modules.user.UserRole;
import com.gradproject.platform.modules.meeting.dto.MeetingAttendanceRequestDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingAttendanceResponseDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingCompletionDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingDraftDTO;
import com.gradproject.platform.modules.meeting.dto.MeetingResponseDTO;
import com.gradproject.platform.modules.meeting.MeetingStatus;
import com.gradproject.platform.modules.meeting.MeetingType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<MeetingResponseDTO> getProjectMeetings(UUID projectId) {
        User currentUser = requireCurrentUser();
        Project project = loadProject(projectId);
        ensureCanViewProjectMeetings(project, currentUser);

        return meetingRepository.findAllByProjectIdOrderByMeetingDateDesc(projectId)
                .stream()
                .map(meeting -> toDto(meeting, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MeetingResponseDTO> getMyMeetings() {
        User currentUser = requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_STUDENT) {
            throw new AccessDeniedException("Only students can view personal meetings.");
        }

        Optional<Project> projectByStudent = projectRepository.findByStudentId(currentUser.getId());
        Optional<Project> projectByTeam = teamMemberRepository.findByUserId(currentUser.getId())
                .flatMap(teamMember -> projectRepository.findByTeamId(teamMember.getTeam().getId()));
        Project project = projectByStudent.orElse(projectByTeam.orElse(null));
        if (project == null) {
            return List.of();
        }

        ensureCanViewProjectMeetings(project, currentUser);
        return meetingRepository.findAllByProjectIdOrderByMeetingDateDesc(project.getId())
                .stream()
                .map(meeting -> toDto(meeting, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MeetingResponseDTO> getSupervisorMeetings() {
        User currentUser = requireCurrentUser();
        if (currentUser.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new AccessDeniedException("Only supervisors can view supervisor meetings.");
        }

        List<Project> assignedProjects = projectRepository.findBySupervisorIdOrderByCreatedAtDesc(currentUser.getId());
        if (assignedProjects.isEmpty()) {
            return List.of();
        }

        return assignedProjects.stream()
                .flatMap(project -> meetingRepository.findAllByProjectIdOrderByMeetingDateDesc(project.getId()).stream())
                .sorted(Comparator.comparing(Meeting::getMeetingDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(meeting -> toDto(meeting, currentUser))
                .toList();
    }

    public MeetingResponseDTO createMeeting(UUID projectId, MeetingDraftDTO request) {
        User currentUser = requireCurrentUser();
        Project project = loadProject(projectId);
        ensureCanCreateMeeting(project, currentUser);

        Meeting meeting = Meeting.builder()
                .project(project)
                .supervisor(currentUser)
                .title(request.title().trim())
                .meetingDate(request.meetingDate())
                .meetingType(request.meetingType() != null ? MeetingType.valueOf(request.meetingType()) : null)
                .locationOrLink(trimToNull(request.locationOrLink()))
                .status(MeetingStatus.SCHEDULED)
                .summary(trimToNull(request.summary()))
                .progressDiscussed(trimToNull(request.progressDiscussed()))
                .tasksAssigned(trimToNull(request.tasksAssigned()))
                .nextSteps(trimToNull(request.nextSteps()))
                .nextMeetingDate(null)
                .build();

        Meeting savedMeeting = meetingRepository.save(meeting);

        notificationService.createNotifications(
                getProjectStudents(project),
                "New meeting scheduled",
                "A new meeting was created for project \"" + project.getTitle() + "\".",
                NotificationType.MEETING_CREATED,
                buildMeetingsLink(project.getId())
        );

        return toDto(savedMeeting, currentUser);
    }

    public MeetingResponseDTO updateMeeting(UUID meetingId, MeetingDraftDTO request) {
        User currentUser = requireCurrentUser();
        Meeting meeting = loadMeeting(meetingId);
        ensureCanEditMeeting(meeting, currentUser);

        meeting.setTitle(request.title().trim());
        meeting.setMeetingDate(request.meetingDate());
        meeting.setMeetingType(request.meetingType() != null ? MeetingType.valueOf(request.meetingType()) : null);
        meeting.setLocationOrLink(trimToNull(request.locationOrLink()));
        meeting.setSummary(trimToNull(request.summary()));
        meeting.setProgressDiscussed(trimToNull(request.progressDiscussed()));
        meeting.setTasksAssigned(trimToNull(request.tasksAssigned()));
        meeting.setNextSteps(trimToNull(request.nextSteps()));
        meeting.setNextMeetingDate(null);
        meeting.setOverallRating(trimToNull(request.overallRating()));
        meeting.setConcernActions(trimToNull(request.concernActions()));
        if (request.attendance() != null && !request.attendance().isEmpty()) {
            Map<UUID, User> teamStudents = loadProjectStudentsById(meeting.getProject());
            validateAttendance(meeting.getProject(), request.attendance(), teamStudents);
            replaceAttendance(meeting, request.attendance(), teamStudents);
        }

        return toDto(meetingRepository.save(meeting), currentUser);
    }

    public void deleteMeeting(UUID meetingId) {
        User currentUser = requireCurrentUser();
        Meeting meeting = loadMeeting(meetingId);
        ensureCanDeleteMeeting(meeting, currentUser);
        meetingRepository.delete(meeting);
    }

    public MeetingResponseDTO requestMeeting(UUID projectId, MeetingDraftDTO request) {
        User currentUser = requireCurrentUser();
        Project project = loadProject(projectId);

        if (!belongsToProjectTeam(project, currentUser)) {
            throw new AccessDeniedException("You are not a member of this project team.");
        }

        Meeting meeting = Meeting.builder()
                .project(project)
                .requestedBy(currentUser)
                .title(request.title().trim())
                .meetingDate(request.meetingDate())
                .meetingType(request.meetingType() != null ? MeetingType.valueOf(request.meetingType()) : null)
                .locationOrLink(trimToNull(request.locationOrLink()))
                .requestMessage(trimToNull(request.requestMessage()))
                .status(MeetingStatus.REQUESTED)
                .build();

        Meeting savedMeeting = meetingRepository.save(meeting);

        if (project.getSupervisor() != null) {
            notificationService.createNotification(
                    project.getSupervisor(),
                    "Meeting request from " + currentUser.getName(),
                    currentUser.getName() + " requested a meeting for project \"" + project.getTitle() + "\".",
                    NotificationType.MEETING_CREATED,
                    buildMeetingsLink(project.getId())
            );
        }

        return toDto(savedMeeting, currentUser);
    }

    public MeetingResponseDTO approveMeetingRequest(UUID meetingId) {
        return approveMeetingRequest(meetingId, null);
    }

    public MeetingResponseDTO approveMeetingRequest(UUID meetingId, MeetingDraftDTO request) {
        User currentUser = requireCurrentUser();
        Meeting meeting = loadMeeting(meetingId);
        ensureCanEditMeeting(meeting, currentUser);

        if (meeting.getStatus() != MeetingStatus.REQUESTED) {
            throw new BadRequestException("Only REQUESTED meetings can be approved.");
        }

        if (request != null) {
            meeting.setTitle(request.title().trim());
            meeting.setMeetingDate(request.meetingDate());
            meeting.setMeetingType(request.meetingType() != null ? MeetingType.valueOf(request.meetingType()) : null);
            meeting.setLocationOrLink(trimToNull(request.locationOrLink()));
            meeting.setRequestMessage(trimToNull(request.requestMessage()));
        }
        meeting.setStatus(MeetingStatus.SCHEDULED);
        meeting.setSupervisor(currentUser);

        Meeting savedMeeting = meetingRepository.save(meeting);

        if (meeting.getRequestedBy() != null) {
            notificationService.createNotification(
                    meeting.getRequestedBy(),
                    "Meeting request approved",
                    "Your meeting request for project \"" + meeting.getProject().getTitle() + "\" has been approved.",
                    NotificationType.MEETING_CREATED,
                    buildMeetingsLink(meeting.getProject().getId())
            );
        }

        return toDto(savedMeeting, currentUser);
    }

    public MeetingResponseDTO rejectMeetingRequest(UUID meetingId) {
        return rejectMeetingRequest(meetingId, null);
    }

    public MeetingResponseDTO rejectMeetingRequest(UUID meetingId, String rejectionReason) {
        User currentUser = requireCurrentUser();
        Meeting meeting = loadMeeting(meetingId);
        ensureCanEditMeeting(meeting, currentUser);

        if (meeting.getStatus() != MeetingStatus.REQUESTED) {
            throw new BadRequestException("Only REQUESTED meetings can be rejected.");
        }

        meeting.setStatus(MeetingStatus.REJECTED);

        Meeting savedMeeting = meetingRepository.save(meeting);

        if (meeting.getRequestedBy() != null) {
            notificationService.createNotification(
                    meeting.getRequestedBy(),
                    "Meeting request rejected",
                    "Your meeting request for project \"" + meeting.getProject().getTitle() + "\" has been rejected."
                            + (StringUtils.hasText(rejectionReason) ? " Reason: " + rejectionReason.trim() : ""),
                    NotificationType.MEETING_CREATED,
                    buildMeetingsLink(meeting.getProject().getId())
            );
        }

        return toDto(savedMeeting, currentUser);
    }

    public MeetingResponseDTO completeMeeting(UUID meetingId, MeetingCompletionDTO request) {
        User currentUser = requireCurrentUser();
        Meeting meeting = loadMeeting(meetingId);
        ensureCanEditMeeting(meeting, currentUser);

        if (meeting.getStatus() != MeetingStatus.SCHEDULED) {
            throw new BadRequestException("Only SCHEDULED meetings can be completed.");
        }

        Map<UUID, User> teamStudents = loadProjectStudentsById(meeting.getProject());
        validateAttendance(meeting.getProject(), request.attendance(), teamStudents);

        meeting.setTitle(request.title().trim());
        meeting.setMeetingDate(request.meetingDate());
        meeting.setMeetingType(request.meetingType() != null ? MeetingType.valueOf(request.meetingType()) : null);
        meeting.setLocationOrLink(trimToNull(request.locationOrLink()));
        meeting.setSummary(trimToNull(request.summary()));
        meeting.setProgressDiscussed(trimToNull(request.progressDiscussed()));
        meeting.setTasksAssigned(trimToNull(request.tasksAssigned()));
        meeting.setNextSteps(trimToNull(request.nextSteps()));
        meeting.setNextMeetingDate(null);
        meeting.setOverallRating(trimToNull(request.overallRating()));
        meeting.setConcernActions(trimToNull(request.concernActions()));
        meeting.setStatus(MeetingStatus.COMPLETED);
        replaceAttendance(meeting, request.attendance(), teamStudents);

        Meeting savedMeeting = meetingRepository.save(meeting);

        notificationService.createNotifications(
                getProjectStudents(meeting.getProject()),
                "Meeting completed",
                "A meeting for project \"" + meeting.getProject().getTitle() + "\" has been completed.",
                NotificationType.MEETING_CREATED,
                buildMeetingsLink(meeting.getProject().getId())
        );

        return toDto(savedMeeting, currentUser);
    }

    public MeetingResponseDTO cancelMeeting(UUID meetingId) {
        User currentUser = requireCurrentUser();
        Meeting meeting = loadMeeting(meetingId);
        boolean supervisorCanEdit = canEditMeeting(meeting, currentUser);
        boolean studentCanCancelOwnRequest = currentUser.getRole() == UserRole.ROLE_STUDENT
                && meeting.getRequestedBy() != null
                && currentUser.getId().equals(meeting.getRequestedBy().getId())
                && belongsToProjectTeam(meeting.getProject(), currentUser)
                && meeting.getStatus() == MeetingStatus.REQUESTED;
        if (!supervisorCanEdit && !studentCanCancelOwnRequest) {
            throw new AccessDeniedException("You are not allowed to modify this meeting.");
        }
        if (meeting.getProject().getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Archived project meetings are read-only.");
        }

        if (meeting.getStatus() != MeetingStatus.REQUESTED && meeting.getStatus() != MeetingStatus.SCHEDULED) {
            throw new BadRequestException("Only REQUESTED or SCHEDULED meetings can be canceled.");
        }

        meeting.setStatus(MeetingStatus.CANCELED);

        Meeting savedMeeting = meetingRepository.save(meeting);

        notificationService.createNotifications(
                getProjectStudents(meeting.getProject()),
                "Meeting canceled",
                "A meeting for project \"" + meeting.getProject().getTitle() + "\" has been canceled.",
                NotificationType.MEETING_CREATED,
                buildMeetingsLink(meeting.getProject().getId())
        );

        return toDto(savedMeeting, currentUser);
    }

    public MeetingResponseDTO toDto(Meeting meeting, User currentUser) {
        Project project = meeting.getProject();
        User supervisor = meeting.getSupervisor();
        User requestedBy = meeting.getRequestedBy();
        boolean canEdit = canEditMeeting(meeting, currentUser);

        return new MeetingResponseDTO(
                meeting.getId(),
                project != null ? project.getId() : null,
                project != null ? project.getTitle() : null,
                supervisor != null ? supervisor.getId() : null,
                supervisor != null ? supervisor.getName() : null,
                meeting.getTitle(),
                meeting.getMeetingDate(),
                meeting.getStatus() != null ? meeting.getStatus().name() : null,
                meeting.getMeetingType() != null ? meeting.getMeetingType().name() : null,
                meeting.getLocationOrLink(),
                meeting.getRequestMessage(),
                requestedBy != null ? requestedBy.getId() : null,
                requestedBy != null ? requestedBy.getName() : null,
                meeting.getSummary(),
                meeting.getProgressDiscussed(),
                meeting.getTasksAssigned(),
                meeting.getNextSteps(),
                meeting.getNextMeetingDate(),
                meeting.getOverallRating(),
                meeting.getConcernActions(),
                meeting.getAttendanceRecords() == null ? List.of() : meeting.getAttendanceRecords().stream()
                        .sorted(Comparator.comparing(record -> record.getStudent() != null ? record.getStudent().getName() : ""))
                        .map(this::toAttendanceDto)
                        .toList(),
                meeting.getCreatedAt(),
                meeting.getUpdatedAt(),
                canEdit,
                canEdit
        );
    }

    private MeetingAttendanceResponseDTO toAttendanceDto(MeetingAttendance attendance) {
        User student = attendance.getStudent();
        return new MeetingAttendanceResponseDTO(
                student != null ? student.getId() : null,
                student != null ? student.getName() : null,
                student != null ? student.getEmail() : null,
                student != null ? student.getUniversityId() : null,
                attendance.getStatus(),
                trimToNull(attendance.getAbsenceReason())
        );
    }

    private Meeting loadMeeting(UUID meetingId) {
        return meetingRepository.findDetailedById(meetingId)
                .orElseThrow(() -> new MeetingNotFoundException(meetingId));
    }

    private Project loadProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new BadRequestException("Project not found."));
    }

    private void replaceAttendance(Meeting meeting, List<MeetingAttendanceRequestDTO> attendanceRequests, Map<UUID, User> teamStudents) {
        if (meeting.getAttendanceRecords() == null) {
            meeting.setAttendanceRecords(new ArrayList<>());
        } else {
            meeting.getAttendanceRecords().clear();
        }

        attendanceRequests.forEach(item -> {
            User student = teamStudents.get(item.studentId());
            meeting.getAttendanceRecords().add(MeetingAttendance.builder()
                    .meeting(meeting)
                    .student(student)
                    .status(item.status())
                    .absenceReason(resolveAbsenceReason(item))
                    .build());
        });
    }

    private void validateAttendance(Project project, List<MeetingAttendanceRequestDTO> attendanceRequests, Map<UUID, User> teamStudents) {
        if (attendanceRequests == null || attendanceRequests.isEmpty()) {
            throw new BadRequestException("Attendance status is required.");
        }

        if (teamStudents.isEmpty()) {
            throw new BadRequestException("Project team members could not be found.");
        }

        Map<UUID, MeetingAttendanceRequestDTO> attendanceByStudentId = new LinkedHashMap<>();
        for (MeetingAttendanceRequestDTO item : attendanceRequests) {
            if (item == null || item.studentId() == null) {
                throw new BadRequestException("Student is not a member of this project team.");
            }
            if (item.status() == null) {
                throw new BadRequestException("Attendance status is required.");
            }
            if (!teamStudents.containsKey(item.studentId())) {
                throw new BadRequestException("Student is not a member of this project team.");
            }
            attendanceByStudentId.put(item.studentId(), item);
        }

        if (attendanceByStudentId.size() != teamStudents.size()) {
            throw new BadRequestException("Attendance status is required.");
        }

        for (UUID studentId : teamStudents.keySet()) {
            if (!attendanceByStudentId.containsKey(studentId)) {
                throw new BadRequestException("Attendance status is required.");
            }
        }
    }

    private String resolveAbsenceReason(MeetingAttendanceRequestDTO request) {
        if (request.status() == MeetingAttendanceStatus.PRESENT) {
            return null;
        }
        return trimToNull(request.absenceReason());
    }

    private void ensureCanViewProjectMeetings(Project project, User currentUser) {
        if (canAdministerAll(currentUser)) {
            return;
        }

        if (currentUser.getRole() == UserRole.ROLE_SUPERVISOR
                && project.getSupervisor() != null
                && currentUser.getId().equals(project.getSupervisor().getId())) {
            return;
        }

        if (currentUser.getRole() == UserRole.ROLE_STUDENT && belongsToProjectTeam(project, currentUser)) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to view meetings for this project.");
    }

    private void ensureCanCreateMeeting(Project project, User currentUser) {
        if (currentUser.getRole() != UserRole.ROLE_SUPERVISOR) {
            throw new AccessDeniedException("Only the assigned supervisor can create meetings.");
        }

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Archived project meetings are read-only.");
        }

        if (project.getSupervisor() == null || !currentUser.getId().equals(project.getSupervisor().getId())) {
            throw new AccessDeniedException("You are not assigned to this project.");
        }
    }

    private void ensureCanEditMeeting(Meeting meeting, User currentUser) {
        if (!canEditMeeting(meeting, currentUser)) {
            throw new AccessDeniedException("You are not allowed to modify this meeting.");
        }
        if (meeting.getProject().getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Archived project meetings are read-only.");
        }
    }

    private void ensureCanDeleteMeeting(Meeting meeting, User currentUser) {
        ensureCanEditMeeting(meeting, currentUser);
    }

    private boolean canEditMeeting(Meeting meeting, User currentUser) {
        if (currentUser.getRole() != UserRole.ROLE_SUPERVISOR) {
            return false;
        }

        if (meeting.getProject() != null
                && meeting.getProject().getSupervisor() != null
                && currentUser.getId().equals(meeting.getProject().getSupervisor().getId())) {
            return true;
        }

        return meeting.getSupervisor() != null
                && currentUser.getId().equals(meeting.getSupervisor().getId());
    }

    private boolean belongsToProjectTeam(Project project, User currentUser) {
        Team team = project.getTeam();
        if (team == null || currentUser.getId() == null) {
            return false;
        }

        if (team.getLeader() != null && currentUser.getId().equals(team.getLeader().getId())) {
            return true;
        }

        return teamMemberRepository.findByTeamIdAndUserId(team.getId(), currentUser.getId()).isPresent();
    }

    private boolean canAdministerAll(User currentUser) {
        return currentUser.getRole() == UserRole.ROLE_DEAN_OFFICE || currentUser.getRole() == UserRole.ROLE_ADMIN;
    }

    private List<User> getProjectStudents(Project project) {
        return new ArrayList<>(loadProjectStudentsById(project).values());
    }

    private Map<UUID, User> loadProjectStudentsById(Project project) {
        Map<UUID, User> recipients = new LinkedHashMap<>();
        Team team = project.getTeam();
        if (team == null) {
            return recipients;
        }

        if (team.getLeader() != null && team.getLeader().getRole() == UserRole.ROLE_STUDENT) {
            recipients.put(team.getLeader().getId(), team.getLeader());
        }

        teamMemberRepository.findAllByTeamId(team.getId()).forEach(member -> {
            User user = member.getUser();
            if (user != null && user.getRole() == UserRole.ROLE_STUDENT) {
                recipients.putIfAbsent(user.getId(), user);
            }
        });

        return recipients;
    }

    private User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Current user not found.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new AccessDeniedException("Current user not found."));
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new AccessDeniedException("Current user not found."));
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Current user not found."));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String buildMeetingsLink(UUID projectId) {
        return "/meetings?projectId=" + projectId;
    }
}
