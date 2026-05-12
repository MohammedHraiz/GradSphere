ALTER TABLE users
ADD COLUMN IF NOT EXISTS graduated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE project_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    archived_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_project_history_project_id ON project_history(project_id);
CREATE INDEX idx_project_history_performed_by ON project_history(performed_by);

