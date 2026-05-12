package com.gradproject.platform.modules.project.submission;

import com.gradproject.platform.core.BaseEntity;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "proposal_submissions")
public class ProposalSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "document_path")
    private String documentPath;

    @Column(name = "student_change_note", columnDefinition = "TEXT")
    private String studentChangeNote;

    @ManyToOne(optional = false)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    private User submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDocumentPath() {
        return documentPath;
    }

    public void setDocumentPath(String documentPath) {
        this.documentPath = documentPath;
    }

    public String getStudentChangeNote() {
        return studentChangeNote;
    }

    public void setStudentChangeNote(String studentChangeNote) {
        this.studentChangeNote = studentChangeNote;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(User submittedBy) {
        this.submittedBy = submittedBy;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
}
