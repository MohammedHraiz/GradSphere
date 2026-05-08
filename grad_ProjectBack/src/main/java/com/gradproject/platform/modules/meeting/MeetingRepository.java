package com.gradproject.platform.modules.meeting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
	@EntityGraph(attributePaths = {"project", "supervisor", "attendanceRecords", "attendanceRecords.student"})
	Optional<Meeting> findDetailedById(UUID id);
	@EntityGraph(attributePaths = {"project", "supervisor", "attendanceRecords", "attendanceRecords.student"})
	List<Meeting> findAllByProjectId(UUID projectId);
	@EntityGraph(attributePaths = {"project", "supervisor", "attendanceRecords", "attendanceRecords.student"})
	List<Meeting> findAllByProjectIdOrderByMeetingDateDesc(UUID projectId);
	@EntityGraph(attributePaths = {"project", "supervisor", "requestedBy", "attendanceRecords", "attendanceRecords.student"})
	List<Meeting> findAllByRequestedByIdOrderByMeetingDateDesc(UUID requestedById);
	long countByProjectIdAndMeetingDateAfter(UUID projectId, LocalDateTime dateTime);
	long countByProjectIdAndMeetingDateBefore(UUID projectId, LocalDateTime dateTime);
}

