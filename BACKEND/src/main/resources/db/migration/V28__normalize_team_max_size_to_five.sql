UPDATE teams
SET max_size = 5
WHERE max_size IS NULL OR max_size <> 5;

ALTER TABLE teams
    ALTER COLUMN max_size SET DEFAULT 5,
    ALTER COLUMN max_size SET NOT NULL;

ALTER TABLE teams
    DROP CONSTRAINT IF EXISTS teams_max_size_check;

ALTER TABLE teams
    ADD CONSTRAINT teams_max_size_check CHECK (max_size = 5);
