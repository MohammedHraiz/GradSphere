package com.gradproject.platform.modules.meeting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, UUID> {
	List<Meeting> findAllByProjectId(UUID projectId);
	long countByProjectIdAndMeetingDateAfter(UUID projectId, LocalDateTime dateTime);
	long countByProjectIdAndMeetingDateBefore(UUID projectId, LocalDateTime dateTime);
}

