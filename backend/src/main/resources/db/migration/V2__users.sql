CREATE TABLE users (
                       id              BIGSERIAL PRIMARY KEY,
                       provider        VARCHAR(20)  NOT NULL,
                       provider_id     VARCHAR(255) NOT NULL,
                       email           VARCHAR(255),
                       display_name    VARCHAR(255) NOT NULL,
                       avatar_url      VARCHAR(500),
                       created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

                       CONSTRAINT uq_users_provider UNIQUE (provider, provider_id)
);