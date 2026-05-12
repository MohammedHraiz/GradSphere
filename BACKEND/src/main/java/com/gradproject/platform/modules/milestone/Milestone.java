package com.gradproject.platform.modules.milestone;

import com.gradproject.platform.core.BaseEntity;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "milestones")
@Getter
@Setter
public class Milestone extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_date")
    private Instant completedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MilestoneStatus status = MilestoneStatus.NOT_STARTED;

    @Column(name = "key_requirements", columnDefinition = "TEXT")
    private String keyRequirements;

    @Column(name = "review_feedback", columnDefinition = "TEXT")
    private String reviewFeedback;

    @Column(name = "submission_file_path")
    private String submissionFilePath;

    @Column(name = "submission_file_name")
    private String submissionFileName;

    @Column(name = "submission_notes", columnDefinition = "TEXT")
    private String submissionNotes;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdByUser;
}
