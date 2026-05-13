ALTER TABLE teams
    ADD COLUMN project_domain VARCHAR(100);

ALTER TABLE projects
    ADD COLUMN project_domain VARCHAR(100);

UPDATE projects p
SET project_domain = t.project_domain
FROM teams t
WHERE p.team_id = t.id
  AND p.project_domain IS NULL
  AND t.project_domain IS NOT NULL;
