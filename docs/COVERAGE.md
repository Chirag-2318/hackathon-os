# Backend & Frontend API Endpoint Coverage Audit

**Total Endpoints Identified**: 234
**Covered by Frontend Clients**: 215
**Audit Coverage Score**: **91.9%**

| Controller | Method | Endpoint Path | Frontend Status |
| :--- | :--- | :--- | :--- |
| `ActivityController` | `GET` | `/api/v1/rooms/{roomId}/activity` | ✅ Connected |
| `ApiHubController` | `GET` | `/api/v1/rooms/{roomId}/apis` | ✅ Connected |
| `ApiHubController` | `POST` | `/api/v1/rooms/{roomId}/apis/externals` | ✅ Connected |
| `ApiHubController` | `PATCH` | `/api/v1/rooms/{roomId}/apis/externals/{id}` | ✅ Connected |
| `ApiHubController` | `DELETE` | `/api/v1/rooms/{roomId}/apis/externals/{id}` | ✅ Connected |
| `ApiHubController` | `POST` | `/api/v1/rooms/{roomId}/apis/externals/{id}/check` | ✅ Connected |
| `ApiHubController` | `POST` | `/api/v1/rooms/{roomId}/apis/endpoints` | ✅ Connected |
| `ApiHubController` | `PUT` | `/api/v1/rooms/{roomId}/apis/endpoints/{id}` | ✅ Connected |
| `ApiHubController` | `DELETE` | `/api/v1/rooms/{roomId}/apis/endpoints/{id}` | ✅ Connected |
| `ApiHubController` | `POST` | `/api/v1/rooms/{roomId}/apis/import` | ✅ Connected |
| `ApiHubController` | `GET` | `/api/v1/rooms/{roomId}/apis/openapi.json` | ✅ Connected |
| `ApiHubController` | `PUT` | `/api/v1/rooms/{roomId}/apis/mock` | ✅ Connected |
| `BriefController` | `GET` | `/api/v1/rooms/{roomId}/brief` | ✅ Connected |
| `BriefController` | `PUT` | `/api/v1/rooms/{roomId}/brief` | ✅ Connected |
| `BriefController` | `PATCH` | `/api/v1/rooms/{roomId}/brief/confirmed-fields` | ✅ Connected |
| `BriefController` | `POST` | `/api/v1/rooms/{roomId}/brief/source/link` | ✅ Connected |
| `BriefController` | `POST` | `/api/v1/rooms/{roomId}/brief/source/pdf` | ✅ Connected |
| `BriefController` | `GET` | `/api/v1/rooms/{roomId}/brief/extraction-prompt` | ✅ Connected |
| `BriefController` | `POST` | `/api/v1/rooms/{roomId}/brief/extract/validate` | ✅ Connected |
| `BriefController` | `POST` | `/api/v1/rooms/{roomId}/brief/extract/auto` | ✅ Connected |
| `BriefController` | `POST` | `/api/v1/rooms/{roomId}/brief/confirm` | ✅ Connected |
| `BriefController` | `DELETE` | `/api/v1/rooms/{roomId}/brief` | ✅ Connected |
| `PublicPlaybookController` | `GET` | `/api/v1/playbooks` | ✅ Connected |
| `PublicPlaybookController` | `GET` | `/api/v1/playbooks/{slug}` | ✅ Connected |
| `PublicToolController` | `GET` | `/api/v1/tools` | ⚡ Available / Dev / SSE |
| `CheckpointController` | `GET` | `/api/v1/rooms/{roomId}/checkpoints` | ✅ Connected |
| `CheckpointController` | `POST` | `/api/v1/rooms/{roomId}/checkpoints/{id}/pass` | ✅ Connected |
| `CheckpointController` | `PATCH` | `/api/v1/rooms/{roomId}/checkpoints/{id}/progress` | ✅ Connected |
| `PublicHealthController` | `GET` | `/api/v1/health` | ⚡ Available / Dev / SSE |
| `CrowdCheckController` | `GET` | `/api/v1/rooms/{roomId}/crowd-check` | ✅ Connected |
| `CrowdCheckController` | `POST` | `/api/v1/rooms/{roomId}/crowd-check/rows` | ✅ Connected |
| `CrowdCheckController` | `PATCH` | `/api/v1/rooms/{roomId}/crowd-check/rows/{rowId}` | ✅ Connected |
| `CrowdCheckController` | `DELETE` | `/api/v1/rooms/{roomId}/crowd-check/rows/{rowId}` | ✅ Connected |
| `DemoController` | `GET` | `/api/v1/rooms/{roomId}/demo` | ✅ Connected |
| `DemoController` | `PUT` | `/api/v1/rooms/{roomId}/demo/sections` | ✅ Connected |
| `DemoController` | `PUT` | `/api/v1/rooms/{roomId}/demo/shots` | ✅ Connected |
| `DemoController` | `PATCH` | `/api/v1/rooms/{roomId}/demo/insurance/{key}` | ✅ Connected |
| `DemoController` | `PUT` | `/api/v1/rooms/{roomId}/demo/media` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/demo-room` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/rooms/{roomId}/fake-members` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/rooms/{roomId}/seed-ideas` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/rooms/{roomId}/set-clock` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/rooms/{roomId}/simulate-progress` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/rooms/{roomId}/github/add-commits` | ✅ Connected |
| `DevController` | `POST` | `/api/v1/dev/rooms/{roomId}/seed-present` | ✅ Connected |
| `DiagramController` | `GET` | `/api/v1/rooms/{roomId}/diagrams` | ✅ Connected |
| `DiagramController` | `POST` | `/api/v1/rooms/{roomId}/diagrams` | ✅ Connected |
| `DiagramController` | `PUT` | `/api/v1/rooms/{roomId}/diagrams/{id}` | ✅ Connected |
| `DiagramController` | `DELETE` | `/api/v1/rooms/{roomId}/diagrams/{id}` | ✅ Connected |
| `DocController` | `GET` | `/api/v1/rooms/{roomId}/docs` | ✅ Connected |
| `DocController` | `POST` | `/api/v1/rooms/{roomId}/docs` | ✅ Connected |
| `DocController` | `GET` | `/api/v1/rooms/{roomId}/docs/download.zip` | ✅ Connected |
| `DocController` | `DELETE` | `/api/v1/rooms/{roomId}/docs/comments/{commentId}` | ✅ Connected |
| `DocController` | `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}` | ✅ Connected |
| `DocController` | `PUT` | `/api/v1/rooms/{roomId}/docs/{fileName}` | ✅ Connected |
| `DocController` | `DELETE` | `/api/v1/rooms/{roomId}/docs/{fileName}` | ✅ Connected |
| `DocController` | `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}/versions/{version}` | ✅ Connected |
| `DocController` | `POST` | `/api/v1/rooms/{roomId}/docs/{fileName}/restore` | ✅ Connected |
| `DocController` | `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}/comments` | ✅ Connected |
| `DocController` | `POST` | `/api/v1/rooms/{roomId}/docs/{fileName}/comments` | ✅ Connected |
| `DocController` | `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}/download` | ✅ Connected |
| `EventStreamController` | `GET` | `/api/v1/rooms/{roomId}/events` | ✅ Connected |
| `EventStreamController` | `GET` | `/api/v1/notifications/stream` | ⚡ Available / Dev / SSE |
| `GitHubController` | `GET` | `/api/v1/rooms/{roomId}/github` | ✅ Connected |
| `GitHubController` | `POST` | `/api/v1/rooms/{roomId}/github/connect` | ✅ Connected |
| `GitHubController` | `DELETE` | `/api/v1/rooms/{roomId}/github/connect` | ✅ Connected |
| `GitHubController` | `POST` | `/api/v1/rooms/{roomId}/github/sync` | ✅ Connected |
| `GitHubController` | `PATCH` | `/api/v1/rooms/{roomId}/github/branches/{branchId}` | ✅ Connected |
| `GitHubController` | `PUT` | `/api/v1/rooms/{roomId}/github/branches/{branchId}/tasks` | ✅ Connected |
| `GitHubController` | `PUT` | `/api/v1/rooms/{roomId}/github/deployed-link` | ✅ Connected |
| `GitHubController` | `POST` | `/api/v1/rooms/{roomId}/github/freeze` | ✅ Connected |
| `GitHubController` | `GET` | `/api/v1/rooms/{roomId}/github/freeze` | ✅ Connected |
| `GitHubController` | `POST` | `/api/v1/rooms/{roomId}/github/attention/{itemKey}/dismiss` | ✅ Connected |
| `GitHubController` | `GET` | `/api/v1/github/my-repos` | ⚡ Available / Dev / SSE |
| `HomeController` | `GET` | `/api/v1/home` | ✅ Connected |
| `IdeasController` | `GET` | `/api/v1/rooms/{roomId}/ideate` | ✅ Connected |
| `IdeasController` | `GET` | `/api/v1/rooms/{roomId}/ideas` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}/ideas` | ✅ Connected |
| `IdeasController` | `PATCH` | `/api/v1/rooms/{roomId}/ideas/{ideaId}` | ✅ Connected |
| `IdeasController` | `DELETE` | `/api/v1/rooms/{roomId}/ideas/{ideaId}` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/approve` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/reject` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/restore` | ✅ Connected |
| `IdeasController` | `PUT` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/primary` | ✅ Connected |
| `IdeasController` | `DELETE` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/primary` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/set-primary` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}` | ✅ Connected |
| `IdeasController` | `POST` | `/api/v1/rooms/{roomId}` | ✅ Connected |
| `IdeasController` | `GET` | `/api/v1/rooms/{roomId}/ideas/export.md` | ✅ Connected |
| `InviteController` | `POST` | `/api/v1/rooms/{roomId}/invites` | ✅ Connected |
| `InviteController` | `GET` | `/api/v1/rooms/{roomId}/invites` | ✅ Connected |
| `InviteController` | `DELETE` | `/api/v1/rooms/{roomId}/invites/{inviteId}` | ✅ Connected |
| `InviteController` | `GET` | `/api/v1/invites/{token}` | ✅ Connected |
| `InviteController` | `POST` | `/api/v1/invites/{token}/join` | ✅ Connected |
| `InviteController` | `POST` | `/api/v1/rooms/join` | ⚡ Available / Dev / SSE |
| `MemberController` | `GET` | `/api/v1/rooms/{roomId}/members` | ✅ Connected |
| `MemberController` | `PATCH` | `/api/v1/rooms/{roomId}/members/{userId}/role` | ✅ Connected |
| `MemberController` | `PATCH` | `/api/v1/rooms/{roomId}/members/{userId}/skills` | ✅ Connected |
| `MemberController` | `DELETE` | `/api/v1/rooms/{roomId}/members/{userId}` | ✅ Connected |
| `MemberController` | `POST` | `/api/v1/rooms/{roomId}/leave` | ✅ Connected |
| `MemberController` | `POST` | `/api/v1/rooms/{roomId}/invitations` | ✅ Connected |
| `MemberController` | `DELETE` | `/api/v1/rooms/{roomId}/invitations/{id}` | ✅ Connected |
| `MemberController` | `POST` | `/api/v1/rooms/{roomId}/heartbeat` | ✅ Connected |
| `MentorController` | `POST` | `/api/v1/rooms/{roomId}/mentor-links` | ✅ Connected |
| `MentorController` | `GET` | `/api/v1/rooms/{roomId}/mentor-links` | ✅ Connected |
| `MentorController` | `DELETE` | `/api/v1/rooms/{roomId}/mentor-links/{linkId}` | ✅ Connected |
| `MentorController` | `GET` | `/api/v1/rooms/{roomId}/mentor-questions` | ✅ Connected |
| `MentorController` | `PATCH` | `/api/v1/rooms/{roomId}/mentor-questions/{id}` | ✅ Connected |
| `PublicMentorController` | `GET` | `/api/v1/mentor/{token}/context` | ✅ Connected |
| `PublicMentorController` | `POST` | `/api/v1/mentor/{token}/ask` | ✅ Connected |
| `MetaController` | `GET` | `/api/v1/meta` | ⚡ Available / Dev / SSE |
| `MvpController` | `GET` | `/api/v1/rooms/{roomId}/mvp` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp/pitch` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp/core-flow` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp/ledger` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp/health` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp/judge-prep` | ✅ Connected |
| `MvpController` | `PUT` | `/api/v1/rooms/{roomId}/mvp/cut-list` | ✅ Connected |
| `NotificationController` | `GET` | `/api/v1/notifications` | ✅ Connected |
| `NotificationController` | `GET` | `/api/v1/notifications/unread-count` | ⚡ Available / Dev / SSE |
| `NotificationController` | `GET` | `/api/v1/rooms/{roomId}/notifications` | ✅ Connected |
| `NotificationController` | `PATCH` | `/api/v1/rooms/{roomId}/notifications/{notificationId}/read` | ✅ Connected |
| `NotificationController` | `POST` | `/api/v1/rooms/{roomId}/notifications/mark-all-read` | ✅ Connected |
| `NotificationController` | `POST` | `/api/v1/notifications/mark-all-read` | ⚡ Available / Dev / SSE |
| `OverviewController` | `GET` | `/api/v1/rooms/{roomId}/overview` | ✅ Connected |
| `OverviewController` | `GET` | `/api/v1/rooms/{roomId}/progress` | ✅ Connected |
| `OverviewController` | `GET` | `/api/v1/rooms/{roomId}/workload` | ✅ Connected |
| `OverviewController` | `GET` | `/api/v1/rooms/{roomId}/nav-badges` | ✅ Connected |
| `PitchController` | `GET` | `/api/v1/rooms/{roomId}/pitch/deck` | ✅ Connected |
| `PitchController` | `PUT` | `/api/v1/rooms/{roomId}/pitch/deck/format` | ✅ Connected |
| `PitchController` | `POST` | `/api/v1/rooms/{roomId}/pitch/deck/slides` | ✅ Connected |
| `PitchController` | `PUT` | `/api/v1/rooms/{roomId}/pitch/slides/{id}` | ✅ Connected |
| `PitchController` | `DELETE` | `/api/v1/rooms/{roomId}/pitch/slides/{id}` | ✅ Connected |
| `PitchController` | `PUT` | `/api/v1/rooms/{roomId}/pitch/deck/order` | ✅ Connected |
| `PitchController` | `PUT` | `/api/v1/rooms/{roomId}/pitch/slides/{id}/coverage` | ✅ Connected |
| `PitchController` | `GET` | `/api/v1/rooms/{roomId}/pitch/deck/export.md` | ✅ Connected |
| `PitchController` | `POST` | `/api/v1/rooms/{roomId}/pitch/deck/slides/{id}/draft` | ✅ Connected |
| `PitchController` | `GET` | `/api/v1/rooms/{roomId}/pitch/rehearse` | ✅ Connected |
| `PitchController` | `POST` | `/api/v1/rooms/{roomId}/pitch/rehearse/runs` | ✅ Connected |
| `PitchController` | `DELETE` | `/api/v1/rooms/{roomId}/pitch/rehearse/runs/{id}` | ✅ Connected |
| `PitchController` | `PUT` | `/api/v1/rooms/{roomId}/pitch/rehearse/roles` | ✅ Connected |
| `PitchController` | `GET` | `/api/v1/rooms/{roomId}/pitch/qa` | ✅ Connected |
| `PitchController` | `POST` | `/api/v1/rooms/{roomId}/pitch/qa` | ✅ Connected |
| `PitchController` | `PUT` | `/api/v1/rooms/{roomId}/pitch/qa/{id}` | ✅ Connected |
| `PitchController` | `DELETE` | `/api/v1/rooms/{roomId}/pitch/qa/{id}` | ✅ Connected |
| `PitchController` | `PATCH` | `/api/v1/rooms/{roomId}/pitch/qa/{id}/practiced` | ✅ Connected |
| `PitchController` | `POST` | `/api/v1/rooms/{roomId}/pitch/qa/generate` | ✅ Connected |
| `PitchController` | `POST` | `/api/v1/rooms/{roomId}/pitch/qa/code-defense` | ✅ Connected |
| `PitchController` | `DELETE` | `/api/v1/rooms/{roomId}/pitch/qa/code-defense/{id}` | ✅ Connected |
| `PitchController` | `PATCH` | `/api/v1/rooms/{roomId}/pitch/qa/code-defense/{id}/practiced` | ✅ Connected |
| `PlanController` | `GET` | `/api/v1/rooms/{roomId}/plan` | ✅ Connected |
| `PlanController` | `PUT` | `/api/v1/rooms/{roomId}/plan/steps/{stepKey}` | ✅ Connected |
| `PlanController` | `POST` | `/api/v1/rooms/{roomId}/plan/validate` | ✅ Connected |
| `PlanController` | `POST` | `/api/v1/rooms/{roomId}/plan/steps/{stepKey}/generate` | ✅ Connected |
| `PlanController` | `GET` | `/api/v1/rooms/{roomId}/plan/context.md` | ✅ Connected |
| `PlanController` | `POST` | `/api/v1/rooms/{roomId}/stage/enter-build` | ✅ Connected |
| `PlanController` | `POST` | `/api/v1/rooms/{roomId}/stage/unlock-build` | ✅ Connected |
| `PortfolioController` | `GET` | `/api/v1/portfolio` | ⚡ Available / Dev / SSE |
| `PortfolioController` | `PATCH` | `/api/v1/portfolio/settings` | ⚡ Available / Dev / SSE |
| `PortfolioController` | `PATCH` | `/api/v1/portfolio/{roomId}` | ⚡ Available / Dev / SSE |
| `PublicPortfolioController` | `GET` | `/api/v1/public/portfolio/{slug}` | ⚡ Available / Dev / SSE |
| `PrepController` | `GET` | `/api/v1/rooms/{roomId}/prep` | ✅ Connected |
| `PrepController` | `POST` | `/api/v1/rooms/{roomId}/prep` | ✅ Connected |
| `PrepController` | `PATCH` | `/api/v1/rooms/{roomId}/prep/checklist/{itemId}` | ✅ Connected |
| `PrepController` | `DELETE` | `/api/v1/rooms/{roomId}/prep/{itemId}` | ✅ Connected |
| `ReadinessController` | `GET` | `/api/v1/rooms/{roomId}/readiness` | ✅ Connected |
| `ReadinessController` | `GET` | `/api/v1/rooms/{roomId}/readiness/simulate/questions` | ✅ Connected |
| `ReadinessController` | `POST` | `/api/v1/rooms/{roomId}/readiness/simulate/validate` | ✅ Connected |
| `RetroController` | `GET` | `/api/v1/rooms/{roomId}/retro` | ✅ Connected |
| `RetroController` | `PATCH` | `/api/v1/rooms/{roomId}/retro` | ✅ Connected |
| `RetroController` | `POST` | `/api/v1/rooms/{roomId}/retro/items` | ✅ Connected |
| `RetroController` | `DELETE` | `/api/v1/rooms/{roomId}/retro/items/{id}` | ✅ Connected |
| `RetroController` | `POST` | `/api/v1/rooms/{roomId}/retro/awards` | ✅ Connected |
| `RetroController` | `DELETE` | `/api/v1/rooms/{roomId}/retro/awards/{id}` | ✅ Connected |
| `RoomExportController` | `GET` | `/api/v1/rooms/{roomId}/export.zip` | ✅ Connected |
| `RoomController` | `POST` | `/api/v1/rooms` | ✅ Connected |
| `RoomController` | `GET` | `/api/v1/rooms` | ✅ Connected |
| `RoomController` | `GET` | `/api/v1/rooms/suggest-name` | ✅ Connected |
| `RoomController` | `GET` | `/api/v1/rooms/{roomId}` | ✅ Connected |
| `RoomController` | `PATCH` | `/api/v1/rooms/{roomId}` | ✅ Connected |
| `RoomController` | `DELETE` | `/api/v1/rooms/{roomId}` | ✅ Connected |
| `RoomController` | `POST` | `/api/v1/rooms/{roomId}/join-code/regenerate` | ✅ Connected |
| `RoomController` | `GET` | `/api/v1/rooms/{roomId}/journey` | ✅ Connected |
| `ScheduleController` | `GET` | `/api/v1/rooms/{roomId}/schedule` | ✅ Connected |
| `ScheduleController` | `POST` | `/api/v1/rooms/{roomId}/schedule/events` | ✅ Connected |
| `ScheduleController` | `PATCH` | `/api/v1/rooms/{roomId}/schedule/events/{id}` | ✅ Connected |
| `ScheduleController` | `DELETE` | `/api/v1/rooms/{roomId}/schedule/events/{id}` | ✅ Connected |
| `SearchController` | `GET` | `/api/v1/search` | ✅ Connected |
| `SpeedModeController` | `GET` | `/api/v1/rooms/{roomId}/speed-mode` | ✅ Connected |
| `SpeedModeController` | `POST` | `/api/v1/rooms/{roomId}/speed-mode/tasks/{taskId}/done` | ✅ Connected |
| `SpeedModeController` | `POST` | `/api/v1/rooms/{roomId}/speed-mode/capture` | ✅ Connected |
| `SpeedModeController` | `GET` | `/api/v1/rooms/{roomId}/speed-mode/captures` | ✅ Connected |
| `SpeedModeController` | `DELETE` | `/api/v1/rooms/{roomId}/speed-mode/captures/{captureId}` | ✅ Connected |
| `SubmissionController` | `GET` | `/api/v1/rooms/{roomId}/submission` | ✅ Connected |
| `SubmissionController` | `PUT` | `/api/v1/rooms/{roomId}/submission/draft` | ✅ Connected |
| `SubmissionController` | `POST` | `/api/v1/rooms/{roomId}/submission/draft/generate` | ✅ Connected |
| `SubmissionController` | `PUT` | `/api/v1/rooms/{roomId}/submission/form-fields` | ✅ Connected |
| `SubmissionController` | `PATCH` | `/api/v1/rooms/{roomId}/submission/checklist/{key}` | ✅ Connected |
| `SubmissionController` | `POST` | `/api/v1/rooms/{roomId}/submission/links` | ✅ Connected |
| `SubmissionController` | `DELETE` | `/api/v1/rooms/{roomId}/submission/links/{id}` | ✅ Connected |
| `SubmissionController` | `POST` | `/api/v1/rooms/{roomId}/submission/links/check` | ✅ Connected |
| `SubmissionController` | `POST` | `/api/v1/rooms/{roomId}/submission/verify` | ✅ Connected |
| `SubmissionController` | `POST` | `/api/v1/rooms/{roomId}/submission/mark-submitted` | ✅ Connected |
| `SubmissionController` | `POST` | `/api/v1/rooms/{roomId}/submission/reopen` | ✅ Connected |
| `BoardController` | `GET` | `/api/v1/rooms/{roomId}/board` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks` | ✅ Connected |
| `TaskController` | `GET` | `/api/v1/rooms/{roomId}/tasks/{taskIdOrKey}` | ✅ Connected |
| `TaskController` | `PATCH` | `/api/v1/rooms/{roomId}/tasks/{taskId}` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/move` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/flag` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/assign` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/subtasks` | ✅ Connected |
| `TaskController` | `PATCH` | `/api/v1/rooms/{roomId}/subtasks/{subtaskId}` | ✅ Connected |
| `TaskController` | `DELETE` | `/api/v1/rooms/{roomId}/subtasks/{subtaskId}` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/acceptance` | ✅ Connected |
| `TaskController` | `PATCH` | `/api/v1/rooms/{roomId}/acceptance/{itemId}` | ✅ Connected |
| `TaskController` | `DELETE` | `/api/v1/rooms/{roomId}/acceptance/{itemId}` | ✅ Connected |
| `TaskController` | `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/comments` | ✅ Connected |
| `TaskController` | `PATCH` | `/api/v1/rooms/{roomId}/comments/{commentId}` | ✅ Connected |
| `TaskController` | `DELETE` | `/api/v1/rooms/{roomId}/comments/{commentId}` | ✅ Connected |
| `TaskController` | `PUT` | `/api/v1/rooms/{roomId}/tasks/{taskId}/dependencies` | ✅ Connected |
| `TaskController` | `DELETE` | `/api/v1/rooms/{roomId}/tasks/{taskId}` | ✅ Connected |
| `TeamController` | `GET` | `/api/v1/rooms/{roomId}/team` | ✅ Connected |
| `TeamController` | `PUT` | `/api/v1/rooms/{roomId}/team/charter` | ✅ Connected |
| `EventTemplateController` | `GET` | `/api/v1/event-templates` | ✅ Connected |
| `UserController` | `GET` | `/api/v1/me` | ✅ Connected |
| `UserController` | `GET` | `/api/v1/users/me/settings` | ⚡ Available / Dev / SSE |
| `UserController` | `PATCH` | `/api/v1/users/me/settings` | ⚡ Available / Dev / SSE |
| `UserController` | `POST` | `/api/v1/users/me/api-keys` | ⚡ Available / Dev / SSE |
| `UserController` | `DELETE` | `/api/v1/users/me/api-keys/{id}` | ⚡ Available / Dev / SSE |
| `UserController` | `POST` | `/api/v1/users/me/export` | ⚡ Available / Dev / SSE |
| `UserController` | `GET` | `/api/v1/users/me/export/{exportId}` | ⚡ Available / Dev / SSE |
| `UserController` | `DELETE` | `/api/v1/users/me` | ⚡ Available / Dev / SSE |
