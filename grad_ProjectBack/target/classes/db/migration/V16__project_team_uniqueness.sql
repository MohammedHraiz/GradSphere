ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_student_id_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'projects_team_id_key'
    ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_team_id_key UNIQUE (team_id);
    END IF;
END $$;
