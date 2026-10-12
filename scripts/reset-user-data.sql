-- scripts/reset-user-data.sql
-- Truncates all user-created data tables and resets identities,
-- while preserving flyway_schema_history, event_templates, playbooks, and tools.

BEGIN;

TRUNCATE TABLE
    -- V1 User, Room, Membership & Communication Tables
    room_member_skills,
    room_members,
    room_invitations,
    invites,
    notifications,
    activity_events,
    uploaded_files,
    data_exports,
    user_settings,
    user_api_keys,

    -- V3 Planning Flow (Briefs, Ideas, Plans, Docs, Tasks)
    brief_rubric_items,
    briefs,
    idea_links,
    idea_notes,
    ideas,
    task_labels,
    task_dependencies,
    task_acceptance_items,
    subtasks,
    task_comments,
    task_history,
    tasks,
    plan_phases,
    plan_steps,
    doc_comments,
    doc_versions,
    docs,

    -- V4_1 Build Phase, MVP Tracking & Room Monitoring
    mvp_flow_steps,
    mvp_ledger_rows,
    mvp_cut_items,
    mvp_state,
    room_checkpoints,
    team_charter_responses,
    speed_mode_captures,
    reminder_log,

    -- V5 Tech Integrations (GitHub, API Hub, Diagrams, Tokens)
    github_branch_tasks,
    github_commits,
    github_health_items,
    github_frozen_demo,
    github_attention_dismissals,
    github_branches,
    github_repos,
    api_endpoints,
    api_mock_settings,
    api_externals,
    diagrams,
    user_oauth_tokens,

    -- V6 Presentation, Demos, Submissions, Readiness, Retros & Mentors
    pitch_slide_coverage,
    pitch_slides,
    pitch_rehearsals,
    pitch_roles,
    pitch_qa,
    pitch_decks,
    code_defense_drills,
    demo_sections,
    demo_shots,
    demo_insurance_items,
    demo_media,
    submission_checklist_items,
    submission_links,
    submissions,
    readiness_snapshots,
    readiness_simulations,
    retro_items,
    retro_awards,
    retros,
    portfolio_settings,
    portfolio_visibility,
    mentor_questions,
    mentor_links,

    -- V7 User Prep, Crowd Checks & Schedules
    prep_items,
    crowd_rows,
    schedule_events,

    -- Core Root Tables
    rooms,
    users
RESTART IDENTITY CASCADE;

COMMIT;
