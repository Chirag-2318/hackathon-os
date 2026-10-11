--
-- PostgreSQL database dump
--

\restrict dxf2VxbU6b4J7j7XjLRm6WDPOCeSehPANgDRY21zi2gVcruA3dGDpQLyMrkxCvp

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: briefs; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.briefs (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    problem_statement text,
    raw_event_text text,
    format_profile character varying(50),
    ai_use_policy character varying(50),
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    timezone character varying(50) DEFAULT 'UTC'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.briefs OWNER TO hackathon;

--
-- Name: briefs_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.briefs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.briefs_id_seq OWNER TO hackathon;

--
-- Name: briefs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.briefs_id_seq OWNED BY public.briefs.id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO hackathon;

--
-- Name: invites; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.invites (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    token character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invites OWNER TO hackathon;

--
-- Name: invites_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.invites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invites_id_seq OWNER TO hackathon;

--
-- Name: invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.invites_id_seq OWNED BY public.invites.id;


--
-- Name: room_members; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.room_members (
    id bigint NOT NULL,
    room_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role character varying(20) DEFAULT 'MEMBER'::character varying NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.room_members OWNER TO hackathon;

--
-- Name: room_members_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.room_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_members_id_seq OWNER TO hackathon;

--
-- Name: room_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.room_members_id_seq OWNED BY public.room_members.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.rooms (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    leader_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rooms OWNER TO hackathon;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO hackathon;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: rubric_criteria; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.rubric_criteria (
    id bigint NOT NULL,
    brief_id bigint NOT NULL,
    criterion character varying(255) NOT NULL,
    weight integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.rubric_criteria OWNER TO hackathon;

--
-- Name: rubric_criteria_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.rubric_criteria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rubric_criteria_id_seq OWNER TO hackathon;

--
-- Name: rubric_criteria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.rubric_criteria_id_seq OWNED BY public.rubric_criteria.id;


--
-- Name: rule_items; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.rule_items (
    id bigint NOT NULL,
    brief_id bigint NOT NULL,
    category character varying(50) NOT NULL,
    text character varying(500) NOT NULL,
    checked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.rule_items OWNER TO hackathon;

--
-- Name: rule_items_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.rule_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rule_items_id_seq OWNER TO hackathon;

--
-- Name: rule_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.rule_items_id_seq OWNED BY public.rule_items.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: hackathon
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    provider character varying(20) NOT NULL,
    provider_id character varying(255) NOT NULL,
    email character varying(255),
    display_name character varying(255) NOT NULL,
    avatar_url character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO hackathon;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: hackathon
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO hackathon;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hackathon
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: briefs id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.briefs ALTER COLUMN id SET DEFAULT nextval('public.briefs_id_seq'::regclass);


--
-- Name: invites id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.invites ALTER COLUMN id SET DEFAULT nextval('public.invites_id_seq'::regclass);


--
-- Name: room_members id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.room_members ALTER COLUMN id SET DEFAULT nextval('public.room_members_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: rubric_criteria id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rubric_criteria ALTER COLUMN id SET DEFAULT nextval('public.rubric_criteria_id_seq'::regclass);


--
-- Name: rule_items id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rule_items ALTER COLUMN id SET DEFAULT nextval('public.rule_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: briefs; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.briefs (id, room_id, problem_statement, raw_event_text, format_profile, ai_use_policy, starts_at, ends_at, timezone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init	SQL	V1__init.sql	78787420	hackathon	2026-10-04 13:19:34.598756	10	t
2	2	users	SQL	V2__users.sql	417514722	hackathon	2026-10-04 13:19:34.665041	10	t
3	3	rooms	SQL	V3__rooms.sql	-947685283	hackathon	2026-10-04 15:55:31.616614	64	t
4	4	briefs	SQL	V4__briefs.sql	-1773700207	hackathon	2026-10-08 14:34:37.228409	74	t
\.


--
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.invites (id, room_id, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: room_members; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.room_members (id, room_id, user_id, role, joined_at) FROM stdin;
1	1	4	LEADER	2026-10-05 17:08:45.78447+00
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.rooms (id, name, leader_id, created_at) FROM stdin;
1	egd	4	2026-10-05 17:08:45.724362+00
\.


--
-- Data for Name: rubric_criteria; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.rubric_criteria (id, brief_id, criterion, weight) FROM stdin;
\.


--
-- Data for Name: rule_items; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.rule_items (id, brief_id, category, text, checked) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hackathon
--

COPY public.users (id, provider, provider_id, email, display_name, avatar_url, created_at) FROM stdin;
1	github	219382134	chirag23nzr@gmail.com	Chirag-2318	https://avatars.githubusercontent.com/u/219382134?v=4	2026-10-04 13:35:25.272043+00
2	google	118337012722816306280	rakeshpatil88405@gmail.com	Rakesh Patil	https://lh3.googleusercontent.com/a/ACg8ocJfJ2zwwvmOf0IerKhgOC0mon7x0gnRSWFKpaKt6mSD6ePWcA=s96-c	2026-10-04 13:45:09.16592+00
3	google	106202275659755993131	chirag23nzr@gmail.com	ß┤ä╩£╔¬╩Çß┤Ç╔ó ß┤ÿß┤Çß┤¢╔¬╩ƒ	https://lh3.googleusercontent.com/a/ACg8ocKP42g6suVA7HQVW49q8bkVSOh8xU_qj4NaEOAlR1M0drjMUpDa=s96-c	2026-10-04 13:55:25.645823+00
4	google	116006530894789407171	chirag23ind@gmail.com	Chirag Patil	https://lh3.googleusercontent.com/a/ACg8ocL0kiJrICE42pinUog4JakWzapEkV0M75g9fHGUkswSB6QJ8S0=s96-c	2026-10-04 16:23:00.684048+00
5	github	1	devuser1@example.com	devuser_1	https://avatars.githubusercontent.com/u/1?v=4	2026-10-04 17:19:58.563453+00
\.


--
-- Name: briefs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.briefs_id_seq', 1, false);


--
-- Name: invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.invites_id_seq', 1, false);


--
-- Name: room_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.room_members_id_seq', 1, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.rooms_id_seq', 1, true);


--
-- Name: rubric_criteria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.rubric_criteria_id_seq', 1, false);


--
-- Name: rule_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.rule_items_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hackathon
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: briefs briefs_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_pkey PRIMARY KEY (id);


--
-- Name: briefs briefs_room_id_key; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_room_id_key UNIQUE (room_id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- Name: invites invites_token_key; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_token_key UNIQUE (token);


--
-- Name: room_members room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: rubric_criteria rubric_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rubric_criteria
    ADD CONSTRAINT rubric_criteria_pkey PRIMARY KEY (id);


--
-- Name: rule_items rule_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rule_items
    ADD CONSTRAINT rule_items_pkey PRIMARY KEY (id);


--
-- Name: room_members uq_room_member; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT uq_room_member UNIQUE (room_id, user_id);


--
-- Name: users uq_users_provider; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_provider UNIQUE (provider, provider_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: hackathon
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: briefs briefs_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: invites invites_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_members room_members_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_members room_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: rooms rooms_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id);


--
-- Name: rubric_criteria rubric_criteria_brief_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rubric_criteria
    ADD CONSTRAINT rubric_criteria_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;


--
-- Name: rule_items rule_items_brief_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hackathon
--

ALTER TABLE ONLY public.rule_items
    ADD CONSTRAINT rule_items_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dxf2VxbU6b4J7j7XjLRm6WDPOCeSehPANgDRY21zi2gVcruA3dGDpQLyMrkxCvp

