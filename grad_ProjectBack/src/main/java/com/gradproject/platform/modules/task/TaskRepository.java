package com.gradproject.platform.modules.task;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    @EntityGraph(attributePaths = {"project", "project.team", "assignedTo", "createdByUser"})
    List<Task> findByProjectIdOrderByDueDateAscCreatedAtDesc(UUID projectId);

    @EntityGraph(attributePaths = {"project", "project.team", "assignedTo", "createdByUser"})
    List<Task> findByProjectIdIn(Collection<UUID> projectIds);

    @EntityGraph(attributePaths = {"project", "project.team", "assignedTo", "createdByUser"})
    List<Task> findByStatusInAndDueDateBefore(Collection<TaskStatus> statuses, LocalDate dueDate);
}
