ALTER TABLE meetings
    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    ADD COLUMN meeting_type VARCHAR(50),
    ADD COLUMN request_message TEXT,
    ADD COLUMN location_or_link TEXT,
    ADD COLUMN requested_by_id UUID REFERENCES users(id);

CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_requested_by_id ON meetings(requested_by_id);
