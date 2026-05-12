package com.gradproject.platform.modules.milestone;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {

    @EntityGraph(attributePaths = {"project", "project.team", "createdByUser"})
    List<Milestone> findByProjectIdOrderByDueDateAscCreatedAtDesc(UUID projectId);

    @EntityGraph(attributePaths = {"project", "project.team", "createdByUser"})
    List<Milestone> findByProjectIdIn(Collection<UUID> projectIds);
}
