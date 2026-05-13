CREATE TABLE proposal_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    description TEXT NOT NULL,
    document_path TEXT,
    student_change_note TEXT,
    submitted_by_id UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_proposal_submissions_project_id ON proposal_submissions(project_id);
CREATE INDEX idx_proposal_submissions_version_number ON proposal_submissions(version_number);
CREATE UNIQUE INDEX uq_proposal_submissions_project_version ON proposal_submissions(project_id, version_number);
