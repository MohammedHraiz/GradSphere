CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       university_id VARCHAR(50) UNIQUE,
                       name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(50) NOT NULL,
                       status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                       last_login_at TIMESTAMP WITH TIME ZONE,
                       enabled BOOLEAN DEFAULT TRUE,
                       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       created_by UUID,
                       updated_by UUID
);

CREATE TABLE teams (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       name VARCHAR(255) NOT NULL,
                       leader_id UUID NOT NULL REFERENCES users(id),
                       max_size INT NOT NULL CHECK (max_size >= 2 AND max_size <= 10),
                       supervisor_id UUID REFERENCES users(id),
                       status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                       formed_at TIMESTAMP WITH TIME ZONE,
                       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       created_by UUID,
                       updated_by UUID
);

CREATE TABLE team_members (
                              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                              team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
                              user_id UUID NOT NULL REFERENCES users(id),
                              member_role VARCHAR(50) NOT NULL,
                              membership_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                              joined_at TIMESTAMP WITH TIME ZONE,
                              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                              updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                              UNIQUE(team_id, user_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_teams_leader ON teams(leader_id);