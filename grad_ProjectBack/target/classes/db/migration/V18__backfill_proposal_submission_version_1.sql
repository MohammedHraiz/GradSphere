INSERT INTO proposal_submissions (
    project_id,
    version_number,
    description,
    document_path,
    student_change_note,
    submitted_by_id,
    submitted_at,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    p.id,
    1,
    COALESCE(p.description, ''),
    p.document_path,
    'Initial submission',
    p.student_id,
    COALESCE(p.created_at, NOW()),
    COALESCE(p.created_at, NOW()),
    COALESCE(p.updated_at, p.created_at, NOW()),
    p.student_id,
    p.student_id
FROM projects p
WHERE p.student_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM proposal_submissions ps
      WHERE ps.project_id = p.id
        AND ps.version_number = 1
  );

UPDATE projects p
SET proposal_version = latest.max_version
FROM (
    SELECT project_id, MAX(version_number) AS max_version
    FROM proposal_submissions
    GROUP BY project_id
) latest
WHERE latest.project_id = p.id
  AND COALESCE(p.proposal_version, 1) < latest.max_version;
