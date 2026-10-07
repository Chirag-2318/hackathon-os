CREATE TABLE rooms (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    leader_id   BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_members (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    role        VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_room_member UNIQUE (room_id, user_id)
);

CREATE TABLE invites (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
