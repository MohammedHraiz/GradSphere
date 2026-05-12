UPDATE team_members
SET member_role = UPPER(member_role)
WHERE UPPER(member_role) IN ('LEADER', 'MEMBER');

UPDATE team_members tm
SET member_role = 'LEADER'
FROM teams t
WHERE tm.team_id = t.id
  AND tm.user_id = t.leader_id;

UPDATE team_members tm
SET member_role = 'MEMBER'
FROM teams t
WHERE tm.team_id = t.id
  AND tm.user_id <> t.leader_id;

ALTER TABLE team_members
ADD CONSTRAINT chk_team_members_member_role
CHECK (member_role IN ('LEADER', 'MEMBER'));
