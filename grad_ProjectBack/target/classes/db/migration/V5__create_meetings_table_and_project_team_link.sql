ALTER TABLE projects
ADD COLUMN team_id UUID UNIQUE REFERENCES teams(id);

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    summary TEXT,
    tasks TEXT,
    progress_rating INT,
    project_id UUID NOT NULL REFERENCES projects(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);

