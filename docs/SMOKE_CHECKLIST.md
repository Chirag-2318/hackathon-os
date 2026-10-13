# Hackathon OS Smoke Checklist

A manual verification checklist for the golden path, in exact sequence.

- [ ] **Sign in with Google**: User clicks "Continue with Google" and is redirected into the active session with an authenticated profile.
- [ ] **Sign in with GitHub**: User clicks "Continue with GitHub" and is redirected into the active session with an authenticated profile.
- [ ] **Onboarding (Handle uniqueness, avatar preset, upload)**: User chooses a handle, validates availability in real time, selects an avatar preset or uploads a file, and completes onboarding.
- [ ] **Create room (Valid and invalid)**: Form blocks submission with inline errors when name is blank, then successfully creates a room and routes to Overview when filled.
- [ ] **Second user joins by code**: Second teammate types an 8-character join code, confirms room details in the modal, and is added to the room roster.
- [ ] **Brief intake**: User enters hackathon problem statement via link or text, validates extracted fields, and saves the confirmed brief.
- [ ] **Ideate (Member idea, leader approve and reject)**: Member submits an idea card, leader rejects one with feedback, and leader approves another into the plan.
- [ ] **Plan 5 steps**: Team completes Problem, MVP scope, Architecture, Timeline, and Resource checkpoints with real-time green validation indicators.
- [ ] **Build unlock**: Leader advances stage from Plan to Build, triggering the transition confirmation and an active 10-second Undo toast.
- [ ] **Board drag**: User drags a task from To Do to In Progress, observing smooth column snap and automatic persistence.
- [ ] **Task assign**: User assigns a teammate to a card, displaying their initials avatar immediately across connected tabs.
- [ ] **Docs download**: User clicks the download icon on a document row and saves the raw markdown file to their local filesystem.
- [ ] **MVP Studio**: User opens MVP Studio, reviews scope contracts, and checks off technical milestone definitions.
- [ ] **GitHub link of a public repo**: Leader enters a valid GitHub repository URL, verifying that commit and branch syncing badges activate.
- [ ] **Deck link**: User inputs a pitch deck URL, and the embedded deck preview renders without breaking room navigation.
- [ ] **Pitch kit (Demo, pitch, Q&A)**: User tests video embed playback, starts the pitch rehearsal countdown timer, and expands generated judge Q&A flashcards.
- [ ] **Submission checklist**: Team verifies all required submission artifacts, checking off each item before final lock.
- [ ] **Export ZIP**: User clicks "Export room" from header or Docs, triggering a background archive download of all room artifacts.
- [ ] **Room summary page**: User navigates to Review > Summary, reviewing milestone offsets, team statistics, and clicking "Copy as Markdown".
- [ ] **Leader transfer**: Room leader opens room settings, selects a teammate from the roster, and transfers ownership.
- [ ] **Leave room**: Member clicks "Leave room" on the room card kebab menu, confirms in the modal, and returns to the My Rooms list.
- [ ] **Offline banner behaviour**: Disconnecting network displays the top offline banner warning, refetching automatically once connectivity resumes.
- [ ] **AI disabled by event policy**: When `aiAllowed` is disabled on a room, sparkle buttons and AI draft actions appear disabled with an explanatory tooltip.
- [ ] **AI provider unreachable**: When backend AI gateway is down, UI displays a graceful inline error notice without crashing or exposing server keys.
