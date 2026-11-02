# 6. Data Layer

## 6.1 Database Engine, ORM & Connection Pool
- **Database Engine**: PostgreSQL 17 (`postgres:17-alpine` in container, Render PostgreSQL 17 in cloud).
- **ORM / Driver**: Hibernate 6.x managed via Spring Data JPA (`spring-boot-starter-data-jpa:4.1.1`), with official PostgreSQL JDBC Driver (`org.postgresql.Driver`).
- **Connection Configuration ([application.yml:67-78](file:///backend/src/main/resources/application.yml#L67-L78), [application-prod.yml:16-22](file:///backend/src/main/resources/application-prod.yml#L16-L22))**:
  ```yaml
  spring:
    datasource:
      url: jdbc:postgresql://${DB_HOST}:${DB_PORT:5432}/${DB_NAME}
      username: ${DB_USERNAME}
      password: ${DB_PASSWORD}
      hikari:
        maximum-pool-size: ${DB_POOL_SIZE:5}
        minimum-idle: 1
        connection-timeout: 10000    # 10 seconds wait before failing
        idle-timeout: 600000          # 10 minutes
        max-lifetime: 1800000         # 30 minutes
  ```
- **Transaction Management**: Spring Declarative Transactions (`@Transactional`).
- **Schema Management**: Flyway 10+ (`spring.flyway.enabled: true`). Hibernate automatic schema generation is strictly locked to validation mode:
  ```yaml
  spring.jpa.hibernate.ddl-auto: validate
  ```
  On every application startup, Flyway executes pending SQL migrations, after which Hibernate validates that all 113 `@Entity` classes match the database schema.

---

## 6.2 Database Schema Inventory (116 Tables)
The database schema consists of **116 tables** created across **44 Flyway migration scripts** (from `V1__phase1_schema.sql` through `V43__oauth_server.sql` and `V4_1__phase3_build.sql`). 113 tables are mapped to JPA entities, and 3 (`app_settings`, `waitlist_signups`, `user_upload_usage`) are managed via direct `JdbcTemplate` queries.

| Table Name | Migration Script | Primary Key | Foreign Keys / References | Existing Indexes | Missing Indexes Flagged |
|---|---|---|---|---|---|
| `activity_events` | `V1__phase1_schema.sql` | `id` | actor_id, room_id | idx_activity_events_room_created, idx_activity_events_actor_id, idx_activity_events_room_created_at | - |
| `ai_usage_daily` | `V25__email_prefs_integrations_ai_usage.sql` | `user_id, day` | user_id | idx_ai_usage_daily_user_day | - |
| `api_endpoints` | `V5__phase4_tech.sql` | `id` | room_id | idx_api_endpoints_room_pos | - |
| `api_externals` | `V5__phase4_tech.sql` | `id` | key_owner_id, room_id | idx_api_externals_room_id | - |
| `api_mock_settings` | `V5__phase4_tech.sql` | `id` | room_id | None | - |
| `app_settings` | `V34__app_settings_and_waitlist.sql` | `Composite / Inherited` | - | None | - |
| `brief_rubric_items` | `V3__phase2_planning.sql` | `id` | brief_id | idx_brief_rubric_items_brief_id | - |
| `briefs` | `V3__phase2_planning.sql` | `id` | room_id | idx_briefs_room_id, idx_briefs_confirmed_by | - |
| `client_errors` | `V35__client_errors_and_email_priority.sql` | `id` | build_id, user_id | idx_client_errors_created_at, idx_client_errors_dedupe | - |
| `code_defense_drills` | `V6__phase4_present_review.sql` | `id` | owner_id, room_id | idx_code_defense_drills_room, idx_code_defense_drills_owner_id | - |
| `crowd_rows` | `V7__phase4_catalog_hidden.sql` | `id` | idea_id, room_id | idx_crowd_rows_room | - |
| `data_exports` | `V1__phase1_schema.sql` | `id` | user_id | idx_data_exports_user_id | - |
| `deck_audits` | `V37__github_demo_deck_audits_qna_practice.sql` | `id` | room_id | idx_deck_audits_lookup | - |
| `deck_slides` | `V37__github_demo_deck_audits_qna_practice.sql` | `room_id, page_no` | room_id | None | - |
| `demo_assets` | `V39__pitch_settings_and_demo_station.sql` | `id` | room_id | idx_demo_assets_room_kind | - |
| `demo_insurance_items` | `V6__phase4_present_review.sql` | `id` | room_id | None | - |
| `demo_ladder` | `V39__pitch_settings_and_demo_station.sql` | `room_id, rung` | room_id | None | - |
| `demo_media` | `V6__phase4_present_review.sql` | `id` | room_id | None | - |
| `demo_preflight` | `V39__pitch_settings_and_demo_station.sql` | `id` | room_id | idx_demo_preflight_room | - |
| `demo_sections` | `V6__phase4_present_review.sql` | `id` | room_id | idx_demo_sections_room_pos | - |
| `demo_shots` | `V6__phase4_present_review.sql` | `id` | room_id | idx_demo_shots_room_pos | - |
| `diagrams` | `V5__phase4_tech.sql` | `id` | room_id | idx_diagrams_room_id | - |
| `doc_comments` | `V3__phase2_planning.sql` | `id` | author_id, doc_id | idx_doc_comments_doc_id, idx_doc_comments_doc_created, idx_doc_comments_author_id | - |
| `doc_versions` | `V3__phase2_planning.sql` | `id` | doc_id | idx_doc_versions_doc_id, idx_doc_versions_created_by | - |
| `docs` | `V3__phase2_planning.sql` | `id` | room_id | idx_docs_room_id | - |
| `email_outbox` | `V23__email_outbox_and_room_invites.sql` | `id` | - | idx_email_outbox_pending, idx_email_outbox_hourly_rate, idx_email_outbox_daily_rate, idx_email_outbox_pending_priority | - |
| `event_templates` | `V1__phase1_schema.sql` | `Composite / Inherited` | - | None | - |
| `github_attention_dismissals` | `V5__phase4_tech.sql` | `room_id, item_key, user_id` | room_id, user_id | None | - |
| `github_branch_tasks` | `V5__phase4_tech.sql` | `branch_id, task_id` | branch_id, task_id | None | - |
| `github_branches` | `V5__phase4_tech.sql` | `id` | owner_user_id, room_id | idx_github_branches_room_id, idx_github_branches_owner_id | - |
| `github_commits` | `V5__phase4_tech.sql` | `id` | author_user_id, room_id | idx_github_commits_room_committed | - |
| `github_frozen_demo` | `V5__phase4_tech.sql` | `id` | room_id | None | - |
| `github_health_items` | `V5__phase4_tech.sql` | `id` | room_id | None | - |
| `github_repos` | `V5__phase4_tech.sql` | `id` | room_id | idx_github_repos_connected_by | - |
| `hackathon_suggestions` | `V19__hackathons_and_home_passport.sql` | `id` | user_id | idx_hackathon_suggestions_url, idx_hackathon_suggestions_user_id | - |
| `hackathons` | `V19__hackathons_and_home_passport.sql` | `id` | - | idx_hackathons_active_dates | - |
| `idea_links` | `V3__phase2_planning.sql` | `id` | idea_id | idx_idea_links_idea_id | - |
| `idea_notes` | `V3__phase2_planning.sql` | `id` | idea_id | idx_idea_notes_idea_id | - |
| `ideas` | `V3__phase2_planning.sql` | `id` | author_id, room_id | idx_ideas_room_status_created, idx_ideas_author_id, idx_ideas_decided_by, idx_ideas_room_status | - |
| `invites` | `V1__phase1_schema.sql` | `id` | room_id | idx_invites_room_id, idx_invites_token, idx_invites_expires_at | - |
| `mcp_tokens` | `V42__mcp_tokens.sql` | `id` | client_id, user_id | idx_mcp_tokens_user_id, idx_mcp_tokens_token_hash, idx_mcp_tokens_family_id, idx_mcp_tokens_auth_code_hash | - |
| `mentor_links` | `V6__phase4_present_review.sql` | `id` | room_id | idx_mentor_links_room, idx_mentor_links_created_by | - |
| `mentor_questions` | `V6__phase4_present_review.sql` | `id` | mentor_link_id, room_id | idx_mentor_questions_room, idx_mentor_questions_answered_by, idx_mentor_questions_mentor_link | - |
| `mvp_cut_items` | `V4_1__phase3_build.sql` | `id` | room_id | idx_mvp_cut_items_room_pos | - |
| `mvp_flow_steps` | `V4_1__phase3_build.sql` | `id` | room_id, task_id | idx_mvp_flow_steps_room_pos, idx_mvp_flow_steps_task_id | - |
| `mvp_ledger_rows` | `V4_1__phase3_build.sql` | `id` | owner_id, room_id, task_id | idx_mvp_ledger_rows_room_pos, idx_mvp_ledger_rows_owner_id, idx_mvp_ledger_rows_task_id | - |
| `mvp_state` | `V4_1__phase3_build.sql` | `id` | room_id | None | - |
| `notifications` | `V1__phase1_schema.sql` | `id` | room_id, user_id | idx_notifications_user_read_created, idx_notifications_room_id, idx_notifications_user_read_at, idx_notifications_user_created_at | - |
| `oauth_auth_codes` | `V43__oauth_server.sql` | `Composite / Inherited` | client_id, user_id | idx_oauth_auth_codes_client_id, idx_oauth_auth_codes_user_id | - |
| `oauth_clients` | `V43__oauth_server.sql` | `Composite / Inherited` | client_id | None | - |
| `pitch_deck_sources` | `V12__present_group_schema.sql` | `id` | room_id | None | - |
| `pitch_decks` | `V6__phase4_present_review.sql` | `id` | room_id | None | - |
| `pitch_qa` | `V6__phase4_present_review.sql` | `id` | owner_id, room_id | idx_pitch_qa_room_pos, idx_pitch_qa_owner_id | - |
| `pitch_rehearsals` | `V6__phase4_present_review.sql` | `id` | operator_id, presenter_id, room_id | idx_pitch_rehearsals_room, idx_pitch_rehearsals_presenter_id, idx_pitch_rehearsals_operator_id | - |
| `pitch_roles` | `V6__phase4_present_review.sql` | `id` | operator_id, presenter_id, room_id | idx_pitch_roles_presenter_id, idx_pitch_roles_operator_id | - |
| `pitch_scripts` | `V12__present_group_schema.sql` | `id` | room_id | None | - |
| `pitch_settings` | `V39__pitch_settings_and_demo_station.sql` | `id` | operator_user_id, presenter_user_id, roo | None | - |
| `pitch_slide_coverage` | `V6__phase4_present_review.sql` | `slide_id, criterion` | slide_id | None | - |
| `pitch_slides` | `V6__phase4_present_review.sql` | `id` | room_id | idx_pitch_slides_room_pos | - |
| `pitch_versions` | `V40__pitch_and_rehearsals.sql` | `id` | room_id | idx_pitch_versions_room_ver | - |
| `pitches` | `V40__pitch_and_rehearsals.sql` | `id` | room_id | None | - |
| `plan_interest` | `V26__billing_user_plan.sql` | `id` | user_id | idx_plan_interest_user | - |
| `plan_phases` | `V3__phase2_planning.sql` | `id` | room_id | idx_plan_phases_room_id | - |
| `plan_step_prompts` | `V20__plan_prompts_and_assembly.sql` | `id` | room_id | idx_plan_step_prompts_room | - |
| `plan_steps` | `V3__phase2_planning.sql` | `id` | room_id | idx_plan_steps_room_id | - |
| `playbooks` | `V7__phase4_catalog_hidden.sql` | `Composite / Inherited` | - | None | - |
| `portfolio_settings` | `V6__phase4_present_review.sql` | `id` | user_id | None | - |
| `portfolio_visibility` | `V6__phase4_present_review.sql` | `user_id, room_id` | room_id, user_id | idx_portfolio_visibility_user_pinned | - |
| `prep_items` | `V7__phase4_catalog_hidden.sql` | `id` | room_id | idx_prep_items_room_pos | - |
| `qna_answers` | `V41__qna_defence_trainer.sql` | `user_id, room_id, hash` | room_id, user_id | idx_qna_answers_room_shared | - |
| `qna_items` | `V41__qna_defence_trainer.sql` | `id` | owner_user_id, room_id | idx_qna_items_room_active_pos, idx_qna_items_room_criterion | - |
| `qna_practice` | `V37__github_demo_deck_audits_qna_practice.sql` | `user_id, room_id, question_hash` | room_id, user_id | None | - |
| `qna_progress` | `V41__qna_defence_trainer.sql` | `user_id, room_id, hash` | room_id, user_id | idx_qna_progress_room_hash | - |
| `qna_session_answers` | `V41__qna_defence_trainer.sql` | `id` | session_id | idx_qna_session_answers_session | - |
| `qna_sessions` | `V41__qna_defence_trainer.sql` | `id` | room_id, user_id | idx_qna_sessions_room_user | - |
| `readiness_simulations` | `V6__phase4_present_review.sql` | `id` | room_id, user_id | idx_readiness_simulations_room_created | - |
| `readiness_snapshots` | `V6__phase4_present_review.sql` | `id` | room_id | idx_readiness_snapshots_room_created | - |
| `rehearsals` | `V40__pitch_and_rehearsals.sql` | `id` | room_id, user_id | idx_rehearsals_room, idx_rehearsals_room_user | - |
| `reminder_log` | `V4_1__phase3_build.sql` | `id` | ref_id, user_id | idx_reminder_log_lookup | - |
| `retro_awards` | `V6__phase4_present_review.sql` | `id` | room_id | idx_retro_awards_room | - |
| `retro_items` | `V6__phase4_present_review.sql` | `id` | author_id, room_id | idx_retro_items_room, idx_retro_items_author_id | - |
| `retros` | `V6__phase4_present_review.sql` | `id` | room_id | None | - |
| `room_checkpoints` | `V4_1__phase3_build.sql` | `id` | room_id | idx_room_checkpoints_room_pos | - |
| `room_events` | `V15__live_sync_optimistic_locking_and_performance.sql` | `id` | actor_user_id, entity_id, room_id | idx_room_events_room_id_id, idx_room_events_created_at | - |
| `room_github_demo` | `V37__github_demo_deck_audits_qna_practice.sql` | `id` | room_id | None | - |
| `room_invitations` | `V1__phase1_schema.sql` | `id` | accepted_user_id, room_id | idx_room_invitations_room_id, idx_room_invitations_invitee_text | - |
| `room_invites` | `V23__email_outbox_and_room_invites.sql` | `id` | room_id | idx_room_invites_room_status, idx_room_invites_email, idx_room_invites_token_hash, idx_room_invites_invited_by_rate | - |
| `room_member_skills` | `V1__phase1_schema.sql` | `member_id, skill` | member_id | None | - |
| `room_members` | `V1__phase1_schema.sql` | `id` | room_id, user_id | idx_room_members_user_id, idx_room_members_room_id, idx_room_members_user_id | - |
| `room_phase_docs` | `V29__phase_driven_tasks.sql` | `id` | doc_id, room_id | idx_room_phase_docs_room_phase | - |
| `rooms` | `V1__phase1_schema.sql` | `id` | owner_id, template_id | idx_rooms_owner_id, idx_rooms_archived_at, idx_rooms_template_id, idx_rooms_deleted_at, idx_rooms_workflow_stage, idx_rooms_starts_at, idx_rooms_ends_at | - |
| `schedule_events` | `V7__phase4_catalog_hidden.sql` | `id` | room_id | idx_schedule_events_room_starts | - |
| `speed_mode_captures` | `V4_1__phase3_build.sql` | `id` | room_id, user_id | idx_speed_captures_room_user_created | - |
| `submission_checklist_items` | `V6__phase4_present_review.sql` | `id` | room_id | None | - |
| `submission_links` | `V6__phase4_present_review.sql` | `id` | room_id | idx_submission_links_room | - |
| `submissions` | `V6__phase4_present_review.sql` | `id` | room_id | idx_submissions_submitted_by | - |
| `subtasks` | `V3__phase2_planning.sql` | `id` | task_id | idx_subtasks_task_id, idx_subtasks_task_id | - |
| `task_acceptance_items` | `V3__phase2_planning.sql` | `id` | task_id | idx_task_acceptance_items_task_id | - |
| `task_comments` | `V3__phase2_planning.sql` | `id` | author_id, task_id | idx_task_comments_task_id, idx_task_comments_task_created, idx_task_comments_task_id, idx_task_comments_author_id | - |
| `task_dependencies` | `V3__phase2_planning.sql` | `task_id, depends_on_task_id` | depends_on_task_id, room_id, task_id | idx_task_dependencies_room_id | - |
| `task_history` | `V3__phase2_planning.sql` | `id` | actor_id, task_id | idx_task_history_task_id, idx_task_history_task_created, idx_task_history_task_id, idx_task_history_actor_id | - |
| `task_labels` | `V3__phase2_planning.sql` | `task_id, label` | task_id | None | - |
| `tasks` | `V3__phase2_planning.sql` | `id` | assignee_id, phase_id, reporter_id, room | idx_tasks_room_status_pos, idx_tasks_assignee_id, idx_tasks_phase_id, idx_tasks_room_status_assignee_due, idx_tasks_reporter_id, idx_tasks_phase_id, idx_tasks_room_status, idx_tasks_room_created_at, idx_tasks_assignee_status | - |
| `team_charter_responses` | `V4_1__phase3_build.sql` | `id` | room_id, user_id | None | - |
| `tools` | `V7__phase4_catalog_hidden.sql` | `id` | - | idx_tools_category | - |
| `uploaded_files` | `V1__phase1_schema.sql` | `id` | room_id | idx_uploaded_files_room_id, idx_uploaded_files_uploaded_by | - |
| `user_ai_keys` | `V33__user_ai_keys.sql` | `id` | user_id | idx_user_ai_keys_status | - |
| `user_api_keys` | `V1__phase1_schema.sql` | `id` | user_id | idx_user_api_keys_user_id | - |
| `user_email_prefs` | `V25__email_prefs_integrations_ai_usage.sql` | `user_id, category` | user_id | None | - |
| `user_oauth_tokens` | `V5__phase4_tech.sql` | `user_id, provider` | user_id | None | - |
| `user_plan` | `V26__billing_user_plan.sql` | `id` | user_id | None | - |
| `user_preferences` | `V24__user_preferences.sql` | `id` | user_id | idx_user_preferences_user_id | - |
| `user_settings` | `V1__phase1_schema.sql` | `id` | user_id | None | - |
| `user_upload_usage` | `V34__app_settings_and_waitlist.sql` | `id` | user_id | None | - |
| `users` | `V1__phase1_schema.sql` | `id` | provider_user_id | idx_users_email_lower | - |
| `waitlist_signups` | `V34__app_settings_and_waitlist.sql` | `id` | - | idx_waitlist_signups_email, idx_waitlist_signups_created_at | - |

---

## 6.3 Critical Missing Indexes Audit
The following high-traffic foreign key and query filter columns lack database indexes in Flyway migrations, causing sequential table scans under load:
1. `user_oauth_tokens (user_id)`: Unindexed in `V5__phase4_tech.sql`. Every GitHub token check scans the table.
2. `task_dependencies (task_id, depends_on_task_id)`: Unindexed in `V3__phase2_planning.sql`. Only `room_id` has an index; dependency graph traversals trigger full table scans.
3. `task_labels (task_id)`: Unindexed in `V3__phase2_planning.sql`. Task board queries joining labels trigger sequential scans.
4. `room_phase_docs (doc_id)`: Unindexed in `V29__phase_driven_tasks.sql`.
5. `room_member_skills (member_id)`: Unindexed in `V1__phase1_schema.sql`.
6. `user_email_prefs (user_id)`: Unindexed in `V25__email_prefs_integrations_ai_usage.sql`.
7. `users (provider_user_id)`: Unindexed in `V1__phase1_schema.sql`. OAuth user lookups scan the entire user table if email is not matched first.
8. `pitch_settings (room_id)`: Unindexed in `V39__pitch_settings_and_demo_station.sql`.
9. `pitch_scripts (room_id)`: Unindexed in `V12__present_group_schema.sql`.
10. `demo_ladder (room_id)`: Unindexed in `V39__pitch_settings_and_demo_station.sql`.
11. `demo_insurance_items (room_id)`: Unindexed in `V6__phase4_present_review.sql`.
12. `deck_slides (room_id)`: Unindexed in `V37__github_demo_deck_audits_qna_practice.sql`.
13. `submission_checklist_items (room_id)`: Unindexed in `V6__phase4_present_review.sql`.
14. `team_charter_responses (room_id)`: Unindexed in `V4_1__phase3_build.sql`.
15. `github_health_items (room_id)`: Unindexed in `V5__phase4_tech.sql`.

---

## 6.4 Key Queries & Architectural Anti-Patterns

### 1. External Network Calls Inside Active Database Transactions (CRITICAL)
In 19 service methods across the backend, outbound HTTP requests to external LLM APIs (Groq / OpenAI) or speech-to-text Whisper endpoints are executed **inside a method annotated with `@Transactional`**:
- **BriefService.java**: `autoExtract()`, `extractBrief()`, `setImagesSource()`
- **DocService.java**: `askDocAi()`, `downloadDoc()`
- **PhaseService.java**: `generatePhaseTasks()`
- **DeckAuditService.java**: `auditSlide()`, `auditDeck()`
- **PitchDeckService.java**: `updateCoverage()`, `exportMarkdown()`
- **PitchService.java**: `aiEdit()`
- **QnaService.java**: `submitSessionAnswer()`, `uploadSessionAudio()`, `gradeAnswer()`, `generateMore()`
- **RehearsalService.java**: `uploadAudio()` ([RehearsalService.java:134](file:///backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalService.java#L134)), `getCoachFeedback()`
- **PlanService.java**: `validateStep()`, `generateStep()`

**Impact Under Load**:
When `@Transactional` begins, Spring checks out a JDBC connection from HikariCP. The thread retains this physical connection while performing slow outbound HTTP I/O (10 to 45 seconds). In production, where `maximum-pool-size: 5`, **just 5 concurrent AI prompts or rehearsal uploads will completely exhaust the connection pool**. All normal API traffic across the entire application immediately queues and aborts after 10 seconds with `Connection is not available, request timed out after 10000ms`.

### 2. N+1 Query Patterns
Multiple collection read endpoints execute repetitive queries inside loops instead of batch-fetching or joining:
- **`DocService.listDocs` & `DocService.downloadAllZip`**:
  ```java
  for (Doc doc : docs) {
      List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
      ...
  }
  ```
  Fetching documents in a room triggers N queries against `doc_versions`.
- **`TaskService.getTaskDetail`**:
  Fetches dependencies in a loop via `taskRepository.findById`, fetches comment authors via `userRepository.findById(c.getAuthorId())`, and fetches history actors via `userRepository.findById(h.getActorId())`.
- **`GitHubService.getChecks` & `getContributors`**:
  Iterates over room members, executing `userRepository.findById(m.getUserId())` and `userOAuthTokenRepository.findByUserId(m.getUserId())` per member.
- **`UserService.getDataSummary` & `getDeletePreview`**:
  Iterates over all user memberships, querying `roomRepository.findById(m.getRoomId())` individually per room.

### 3. Unbounded Queries & Missing Slices
- `TaskRepository.findByRoomId(roomId)`: Loads all tasks without `LIMIT` or pagination.
- `IdeaRepository.findByRoomId(roomId)`: Loads all ideas and notes.
- `DocRepository.findByRoomId(roomId)`: Loads all documents.
- `NotificationRepository.findByUserIdOrderByCreatedAtDesc(userId)`: Loads all notifications for a user.

### 4. Race Conditions on Unlocked Concurrent Updates
While 8 entities possess `@Version` optimistic locking (`Task`, `Brief`, `Submission`, `ApiEndpoint`, `ApiExternal`, `MvpState`, `PitchScript`, `PitchSettings`), high-traffic entities such as **`Doc`**, **`Idea`**, **`Room`**, and **`Pitch`** lack `@Version`. Concurrent edits to documents or pitch content execute blind last-write-wins overwrites without conflict detection.

---

## 6.5 Migrations, Seed Data & Backups
- **Flyway Migrations**: 44 sequential scripts (`V1` to `V43` + `V4_1`) located in `backend/src/main/resources/db/migration/`. All migrations are forward-only; there are zero `DROP TABLE` statements.
- **`pgcrypto` Extension**: Enabled in `V1__phase1_schema.sql` via `CREATE EXTENSION IF NOT EXISTS pgcrypto;`. Supported out of the box on Render PostgreSQL.
- **Seed Data Strategy**:
  - Reference data (event templates in `V2` and `V4`, tools catalog in `V8`) is embedded directly inside idempotent SQL migrations using `ON CONFLICT DO NOTHING`.
  - Static configuration seed files: `backend/config/plans.json` (user tiers) and `backend/config/hackathons.json` (hackathon list) are loaded at application boot.
  - Interactive dev seed data: `POST /api/v1/dev/seed` invokes `DevSeedService.java`, creating 3 sample hackathon rooms with realistic tasks, documents, and members.
- **Backup Assumptions**:
  - Render managed PostgreSQL performs automated daily snapshots.
  - No point-in-time recovery (PITR) is configured in code.
  - Local backups can be executed via `pg_dump` targeting the Render PostgreSQL external connection URL.

---

## 6.6 Caching Layer Audit
- **Distributed Cache (Redis / Memcached)**: **NONE**. The application has no connection to Redis, Memcached, or any distributed cache.
- **In-Memory Caches**:
  - `GitHubService.sectionCache`: `ConcurrentHashMap` with 60-second TTL for repository stats.
  - `AppSettingsService`: in-memory capacity cache with synchronized invalidation.
- **HTTP Cache Headers**:
  - Static avatars: `/uploads/**` served with `Cache-Control: public, max-age=31536000` ([WebMvcConfig.java:53](file:///backend/src/main/java/com/hackathonos/backend/common/config/WebMvcConfig.java#L53)).
  - API responses: Vercel edge reverse proxy forces `Cache-Control: no-cache, no-store, must-revalidate` on all `/api/` rewrites ([frontend/vercel.json](file:///frontend/vercel.json#L13-L17)).
- **Invalidation Strategy**: Not applicable beyond in-memory TTL eviction.
