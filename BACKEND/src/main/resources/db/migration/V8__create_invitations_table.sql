CREATE TABLE invitations (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_invitations_sender_id ON invitations(sender_id);
CREATE INDEX idx_invitations_receiver_id ON invitations(receiver_id);
CREATE INDEX idx_invitations_team_id ON invitations(team_id);
CREATE INDEX idx_invitations_status ON invitations(status);

