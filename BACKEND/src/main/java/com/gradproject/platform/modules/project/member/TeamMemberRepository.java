package com.gradproject.platform.modules.project.member;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    @EntityGraph(attributePaths = "user")
    List<TeamMember> findAllByTeamId(UUID teamId);
    boolean existsByUserId(UUID userId);

    @EntityGraph(attributePaths = "team")
    Optional<TeamMember> findByUserId(UUID userId);
    @EntityGraph(attributePaths = {"team", "user"})
    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);
    long countByTeamId(UUID teamId);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from TeamMember tm where tm.team.id = :teamId")
    int deleteByTeamId(@Param("teamId") UUID teamId);
}

