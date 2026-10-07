CREATE TABLE briefs (
    id                  BIGSERIAL PRIMARY KEY,
    room_id             BIGINT NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
    problem_statement   TEXT,
    raw_event_text      TEXT,
    format_profile      VARCHAR(50),
    ai_use_policy       VARCHAR(50),
    starts_at           TIMESTAMPTZ,
    ends_at             TIMESTAMPTZ,
    timezone            VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rubric_criteria (
    id          BIGSERIAL PRIMARY KEY,
    brief_id    BIGINT NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    criterion   VARCHAR(255) NOT NULL,
    weight      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE rule_items (
    id          BIGSERIAL PRIMARY KEY,
    brief_id    BIGINT NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    category    VARCHAR(50) NOT NULL,
    text        VARCHAR(500) NOT NULL,
    checked     BOOLEAN NOT NULL DEFAULT false
);
