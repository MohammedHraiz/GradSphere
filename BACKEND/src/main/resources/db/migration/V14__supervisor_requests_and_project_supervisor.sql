ALTER TABLE projects
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_projects_supervisor_id ON projects(supervisor_id);

CREATE TABLE IF NOT EXISTS supervisor_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    requested_by_id UUID NOT NULL REFERENCES users(id),
    supervisor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    message TEXT,
    response_message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_supervisor_requests_project_id ON supervisor_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_requests_team_id ON supervisor_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_requests_supervisor_id ON supervisor_requests(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_requests_status ON supervisor_requests(status);
