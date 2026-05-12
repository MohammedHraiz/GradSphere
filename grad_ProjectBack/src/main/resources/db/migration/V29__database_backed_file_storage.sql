CREATE TABLE IF NOT EXISTS stored_files (
    id UUID PRIMARY KEY,
    kind VARCHAR(64) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255),
    file_size BIGINT NOT NULL,
    content BYTEA NOT NULL,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    profile_user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    proposal_submission_id UUID UNIQUE REFERENCES proposal_submissions(id) ON DELETE CASCADE,
    milestone_id UUID UNIQUE REFERENCES milestones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_stored_files_owner_user_id ON stored_files(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_project_id ON stored_files(project_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_kind_project_created_at ON stored_files(kind, project_id, created_at DESC);
