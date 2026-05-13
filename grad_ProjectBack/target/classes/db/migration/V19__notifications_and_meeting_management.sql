CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(64) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_notifications_user_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at);

ALTER TABLE meetings
    ADD COLUMN title VARCHAR(255),
    ADD COLUMN progress_discussed TEXT,
    ADD COLUMN next_steps TEXT,
    ADD COLUMN next_meeting_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN supervisor_id UUID REFERENCES users(id);

ALTER TABLE meetings
    RENAME COLUMN tasks TO tasks_assigned;

UPDATE meetings
SET
    title = COALESCE(NULLIF(TRIM(summary), ''), 'Meeting Record'),
    progress_discussed = COALESCE(progress_discussed, summary);
