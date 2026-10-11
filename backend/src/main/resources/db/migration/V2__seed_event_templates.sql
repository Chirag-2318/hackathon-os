INSERT INTO event_templates (id, name, description, duration_hours, team_min, team_max, icon, sort_order, phases)
VALUES
(
    'sih-36h',
    'SIH-style (6 members, 36h)',
    'Smart India Hackathon style 36-hour non-stop sprint with 6 team members.',
    36,
    6,
    6,
    '🏆',
    1,
    '[
        {"name": "Plan", "startPct": 0, "endPct": 25, "exitCheckpoint": "Rules confirmed and roles set"},
        {"name": "Build", "startPct": 25, "endPct": 60, "exitCheckpoint": "Core flow runs end to end"},
        {"name": "Freeze", "startPct": 60, "endPct": 70, "exitCheckpoint": "Scope frozen"},
        {"name": "Polish", "startPct": 70, "endPct": 85, "exitCheckpoint": "Demo rehearsed"},
        {"name": "Submit", "startPct": 85, "endPct": 100, "exitCheckpoint": "Submission verified"}
    ]'::jsonb
),
(
    'online-48h',
    '48-hour online (Devpost-style)',
    'Devpost-style 48-hour asynchronous online hackathon for teams of 1 to 4.',
    48,
    1,
    4,
    '🌐',
    2,
    '[
        {"name": "Plan", "startPct": 0, "endPct": 25, "exitCheckpoint": "Rules confirmed and roles set"},
        {"name": "Build", "startPct": 25, "endPct": 60, "exitCheckpoint": "Core flow runs end to end"},
        {"name": "Freeze", "startPct": 60, "endPct": 70, "exitCheckpoint": "Scope frozen"},
        {"name": "Polish", "startPct": 70, "endPct": 85, "exitCheckpoint": "Demo rehearsed"},
        {"name": "Submit", "startPct": 85, "endPct": 100, "exitCheckpoint": "Submission verified"}
    ]'::jsonb
),
(
    'weekend-mlh',
    'Weekend (MLH-style)',
    'Major League Hacking style 36-hour weekend sprint.',
    36,
    1,
    4,
    '🚀',
    3,
    '[
        {"name": "Plan", "startPct": 0, "endPct": 25, "exitCheckpoint": "Rules confirmed and roles set"},
        {"name": "Build", "startPct": 25, "endPct": 60, "exitCheckpoint": "Core flow runs end to end"},
        {"name": "Freeze", "startPct": 60, "endPct": 70, "exitCheckpoint": "Scope frozen"},
        {"name": "Polish", "startPct": 70, "endPct": 85, "exitCheckpoint": "Demo rehearsed"},
        {"name": "Submit", "startPct": 85, "endPct": 100, "exitCheckpoint": "Submission verified"}
    ]'::jsonb
),
(
    'ai-sprint-4h',
    '4-hour AI sprint',
    'Fast-paced 4-hour generative AI sprint focusing on rapid prototyping.',
    4,
    1,
    3,
    '⚡',
    4,
    '[
        {"name": "Plan", "startPct": 0, "endPct": 25, "exitCheckpoint": "Rules confirmed and roles set"},
        {"name": "Build", "startPct": 25, "endPct": 60, "exitCheckpoint": "Core flow runs end to end"},
        {"name": "Freeze", "startPct": 60, "endPct": 70, "exitCheckpoint": "Scope frozen"},
        {"name": "Polish", "startPct": 70, "endPct": 85, "exitCheckpoint": "Demo rehearsed"},
        {"name": "Submit", "startPct": 85, "endPct": 100, "exitCheckpoint": "Submission verified"}
    ]'::jsonb
),
(
    'corporate',
    'Corporate hackathon',
    'Corporate innovation hackathon with structured checkpoint reviews.',
    24,
    2,
    5,
    '🏢',
    5,
    '[
        {"name": "Plan", "startPct": 0, "endPct": 25, "exitCheckpoint": "Rules confirmed and roles set"},
        {"name": "Build", "startPct": 25, "endPct": 60, "exitCheckpoint": "Core flow runs end to end"},
        {"name": "Freeze", "startPct": 60, "endPct": 70, "exitCheckpoint": "Scope frozen"},
        {"name": "Polish", "startPct": 70, "endPct": 85, "exitCheckpoint": "Demo rehearsed"},
        {"name": "Submit", "startPct": 85, "endPct": 100, "exitCheckpoint": "Submission verified"}
    ]'::jsonb
),
(
    'solo',
    'Solo',
    '24-hour individual challenge to build and ship an MVP.',
    24,
    1,
    1,
    '👤',
    6,
    '[
        {"name": "Plan", "startPct": 0, "endPct": 25, "exitCheckpoint": "Rules confirmed and roles set"},
        {"name": "Build", "startPct": 25, "endPct": 60, "exitCheckpoint": "Core flow runs end to end"},
        {"name": "Freeze", "startPct": 60, "endPct": 70, "exitCheckpoint": "Scope frozen"},
        {"name": "Polish", "startPct": 70, "endPct": 85, "exitCheckpoint": "Demo rehearsed"},
        {"name": "Submit", "startPct": 85, "endPct": 100, "exitCheckpoint": "Submission verified"}
    ]'::jsonb
);
