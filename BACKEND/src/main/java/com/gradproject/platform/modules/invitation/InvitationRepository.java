package com.gradproject.platform.modules.invitation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    List<Invitation> findByReceiverId(UUID receiverId);
    List<Invitation> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, InvitationStatus status);
    List<Invitation> findByTeamIdAndStatusOrderByCreatedAtDesc(UUID teamId, InvitationStatus status);
    long countByReceiverIdAndStatus(UUID receiverId, InvitationStatus status);
    long countByTeamIdAndStatus(UUID teamId, InvitationStatus status);
    long countByStatus(InvitationStatus status);
    Optional<Invitation> findBySenderIdAndReceiverIdAndTeamId(UUID senderId, UUID receiverId, UUID teamId);
    Optional<Invitation> findBySenderIdAndReceiverIdAndTeamIdAndStatusIn(UUID senderId, UUID receiverId, UUID teamId, List<InvitationStatus> statuses);
    boolean existsByReceiverIdAndStatus(UUID receiverId, InvitationStatus status);
    boolean existsByReceiverIdAndTeamIdAndStatus(UUID receiverId, UUID teamId, InvitationStatus status);
}
