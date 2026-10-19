package com.hackathonos.backend.dev;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaLink;
import com.hackathonos.backend.ideas.IdeaLinkRepository;
import com.hackathonos.backend.ideas.IdeaNote;
import com.hackathonos.backend.ideas.IdeaNoteRepository;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.demo.DemoMedia;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.demo.DemoSeedService;
import com.hackathonos.backend.github.GithubBranch;
import com.hackathonos.backend.github.GithubBranchRepository;
import com.hackathonos.backend.github.GithubCommit;
import com.hackathonos.backend.github.GithubCommitRepository;
import com.hackathonos.backend.pitch.PitchDeckService;
import com.hackathonos.backend.pitch.PitchQa;
import com.hackathonos.backend.pitch.PitchQaRepository;
import com.hackathonos.backend.pitch.PitchRehearsal;
import com.hackathonos.backend.pitch.PitchRehearsalRepository;
import com.hackathonos.backend.submission.Submission;
import com.hackathonos.backend.submission.SubmissionRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@Profile("dev")
public class DevService {

    private record FakePersona(String name, String email, String role, List<String> skills) {}

    private static final List<FakePersona> ROSTER = List.of(
            new FakePersona("Ishita Rao", "ishita@hackathonos.dev", "BUILDER", List.of("Frontend", "Design")),
            new FakePersona("Kabir Nair", "kabir@hackathonos.dev", "BUILDER", List.of("Backend", "ML/AI")),
            new FakePersona("Sanjay Gupta", "sanjay@hackathonos.dev", "QA", List.of("QA/Demo", "Presenter")),
            new FakePersona("Priya Lal", "priya@hackathonos.dev", "DESIGNER", List.of("Design", "Domain")),
            new FakePersona("Dev Patel", "dev@hackathonos.dev", "DOMAIN_EXPERT", List.of("Domain", "Presenter"))
    );

    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final RoomAccess roomAccess;
    private final ActivityLogger activityLogger;
    private final IdeaRepository ideaRepository;
    private final IdeaLinkRepository linkRepository;
    private final IdeaNoteRepository noteRepository;
    private final com.hackathonos.backend.rooms.RoomRepository roomRepository;
    private final com.hackathonos.backend.tasks.TaskRepository taskRepository;
    private final java.time.Clock clock;
    private final GithubCommitRepository commitRepository;
    private final GithubBranchRepository branchRepository;
    private final PitchDeckService pitchDeckService;
    private final PitchQaRepository pitchQaRepository;
    private final PitchRehearsalRepository rehearsalRepository;
    private final DemoSeedService demoSeedService;
    private final DemoMediaRepository demoMediaRepository;
    private final SubmissionRepository submissionRepository;

    public DevService(UserRepository userRepository,
                      UserSettingsRepository settingsRepository,
                      RoomMemberRepository memberRepository,
                      RoomMemberSkillRepository skillRepository,
                      RoomAccess roomAccess,
                      ActivityLogger activityLogger,
                      IdeaRepository ideaRepository,
                      IdeaLinkRepository linkRepository,
                      IdeaNoteRepository noteRepository,
                      com.hackathonos.backend.rooms.RoomRepository roomRepository,
                      com.hackathonos.backend.tasks.TaskRepository taskRepository,
                      java.time.Clock clock,
                      GithubCommitRepository commitRepository,
                      GithubBranchRepository branchRepository,
                      PitchDeckService pitchDeckService,
                      PitchQaRepository pitchQaRepository,
                      PitchRehearsalRepository rehearsalRepository,
                      DemoSeedService demoSeedService,
                      DemoMediaRepository demoMediaRepository,
                      SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.roomAccess = roomAccess;
        this.activityLogger = activityLogger;
        this.ideaRepository = ideaRepository;
        this.linkRepository = linkRepository;
        this.noteRepository = noteRepository;
        this.roomRepository = roomRepository;
        this.taskRepository = taskRepository;
        this.clock = clock;
        this.commitRepository = commitRepository;
        this.branchRepository = branchRepository;
        this.pitchDeckService = pitchDeckService;
        this.pitchQaRepository = pitchQaRepository;
        this.rehearsalRepository = rehearsalRepository;
        this.demoSeedService = demoSeedService;
        this.demoMediaRepository = demoMediaRepository;
        this.submissionRepository = submissionRepository;
    }

    /**
     * Seeds realistic test teammates into a room for multi-user UI testing.
     * Only enabled under the dev profile; uses provider DEV and avatar null.
     */
    @Transactional
    public Map<String, Object> addFakeMembers(User caller, UUID roomId, FakeMembersRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        int targetCount = (request != null && request.count() != null && request.count() > 0)
                ? Math.min(request.count(), ROSTER.size())
                : ROSTER.size();

        int added = 0;
        List<String> addedNames = new ArrayList<>();

        for (int i = 0; i < targetCount; i++) {
            FakePersona persona = ROSTER.get(i);
            User fakeUser = getOrCreateFakeUser(persona);

            if (!memberRepository.existsByRoomIdAndUserId(room.getId(), fakeUser.getId())) {
                RoomMember member = new RoomMember(room.getId(), fakeUser.getId(), persona.role());
                memberRepository.save(member);

                for (String skill : persona.skills()) {
                    skillRepository.save(new RoomMemberSkill(member.getId(), skill));
                }

                added++;
                addedNames.add(persona.name());
                activityLogger.log(room, fakeUser, "member_joined", persona.name() + " joined the room");
            }
        }

        return Map.of("added", added, "names", addedNames);
    }

    /**
     * Seeds 5 realistic sample ideas from existing members.
     */
    @Transactional
    public Map<String, Object> seedIdeas(User caller, UUID roomId) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        if (members.isEmpty()) {
            return Map.of("added", 0);
        }

        List<Map<String, Object>> sample = List.of(
                Map.of(
                        "text", "Tinder for hackathon teammates, matching verified GitHub profiles with sprint ambitions. Instant mutual match triggers an automated repo fork, Discord room, and shared planning board in 2 seconds.",
                        "links", List.of(Map.of("url", "https://github.com", "title", "GitHub API")),
                        "notes", List.of("Focus on skill complementarity rather than resume bullet points")
                ),
                Map.of(
                        "text", "AI-driven code review bot that parses pull requests for hackathon teams and suggests quick MVP performance wins before judges test the live demo.",
                        "links", List.of(Map.of("url", "https://openai.com", "title", "OpenAI Embeddings")),
                        "notes", List.of("Check rate limits under concurrent traffic")
                ),
                Map.of(
                        "text", "Late-night campus food aggregator for hostel students with UPI group payments and dorm delivery tracking on a live campus map.",
                        "links", List.of(Map.of("url", "https://maps.google.com", "title", "Campus Map")),
                        "notes", List.of("Requires local vendor phone numbers")
                ),
                Map.of(
                        "text", "Automated judge rubrics scorekeeper with real-time pitch deck transcription and key metric highlighting.",
                        "links", List.of(Map.of("url", "https://whisper.openai.com", "title", "Whisper API")),
                        "notes", List.of("Audio stream latency must be sub-second")
                ),
                Map.of(
                        "text", "Zero-config telemetry agent for hackathon webapps with real-time error logs and judge crash notification alarms.",
                        "links", List.of(Map.of("url", "https://sentry.io", "title", "Sentry")),
                        "notes", List.of("Embed lightweight SDK snippet")
                )
        );

        int count = 0;
        for (int i = 0; i < sample.size(); i++) {
            Map<String, Object> data = sample.get(i);
            RoomMember authorMember = members.get(i % members.size());
            com.hackathonos.backend.ideas.Idea idea = new com.hackathonos.backend.ideas.Idea(
                    roomId, authorMember.getUserId(), (String) data.get("text")
            );
            idea = ideaRepository.save(idea);

            @SuppressWarnings("unchecked")
            List<Map<String, String>> links = (List<Map<String, String>>) data.get("links");
            if (links != null) {
                for (Map<String, String> l : links) {
                    linkRepository.save(new com.hackathonos.backend.ideas.IdeaLink(idea.getId(), l.get("url"), l.get("title")));
                }
            }

            @SuppressWarnings("unchecked")
            List<String> notes = (List<String>) data.get("notes");
            if (notes != null) {
                for (String n : notes) {
                    noteRepository.save(new com.hackathonos.backend.ideas.IdeaNote(idea.getId(), n));
                }
            }
            count++;
        }

        return Map.of("added", count);
    }

    /**
     * Shifts room event start and end so that now is at hourOfEvent.
     */
    @Transactional
    public Map<String, Object> setClock(User caller, UUID roomId, int hourOfEvent) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        java.time.Instant now = clock.instant();
        java.time.Duration duration = (room.getEventStart() != null && room.getEventEnd() != null)
                ? java.time.Duration.between(room.getEventStart(), room.getEventEnd())
                : java.time.Duration.ofHours(48);

        room.setEventStart(now.minus(java.time.Duration.ofHours(hourOfEvent)));
        room.setEventEnd(room.getEventStart().plus(duration));
        roomRepository.save(room);

        return Map.of(
                "hourOfEvent", hourOfEvent,
                "eventStart", room.getEventStart().toString(),
                "eventEnd", room.getEventEnd().toString()
        );
    }

    /**
     * Marks a percentage of tasks done, sets some inprogress, flags one, leaves some unassigned.
     */
    @Transactional
    public Map<String, Object> simulateProgress(User caller, UUID roomId, int percent) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        List<com.hackathonos.backend.tasks.Task> tasks = taskRepository.findByRoomId(roomId);
        if (tasks.isEmpty()) {
            return Map.of("simulatedPercent", percent, "tasksCount", 0);
        }

        tasks.sort((a, b) -> {
            if (a.getDueAt() != null && b.getDueAt() != null) {
                return a.getDueAt().compareTo(b.getDueAt());
            }
            if (a.getDueAt() != null) return -1;
            if (b.getDueAt() != null) return 1;
            return Integer.compare(a.getPosition(), b.getPosition());
        });

        int n = tasks.size();
        int targetDone = (int) Math.round((Math.max(0, Math.min(100, percent)) / 100.0) * n);
        java.time.Instant now = clock.instant();

        for (int i = 0; i < n; i++) {
            com.hackathonos.backend.tasks.Task t = tasks.get(i);
            if (i < targetDone) {
                t.setStatus("done");
                t.setCompletedAt(now.minus(java.time.Duration.ofHours((targetDone - i) * 2L + 1)));
            } else if (i < targetDone + 2 && i < n) {
                t.setStatus("inprogress");
                t.setCompletedAt(null);
            } else {
                t.setStatus("todo");
                t.setCompletedAt(null);
            }
            taskRepository.save(t);
        }

        // Flag 1 not-done task with a reason
        for (com.hackathonos.backend.tasks.Task t : tasks) {
            if (!"done".equalsIgnoreCase(t.getStatus())) {
                t.setFlagged(true);
                t.setBlockedReason("Waiting for API key integration");
                taskRepository.save(t);
                break;
            }
        }

        // Leave 1 task unassigned
        for (com.hackathonos.backend.tasks.Task t : tasks) {
            if (!"done".equalsIgnoreCase(t.getStatus()) && !t.isFlagged()) {
                t.setAssigneeId(null);
                taskRepository.save(t);
                break;
            }
        }

        return Map.of("simulatedPercent", percent, "doneCount", targetDone, "totalTasks", n);
    }

    /**
     * Appends synthetic commits to a branch; supports simulating commits before kickoff.
     */
    @Transactional
    public Map<String, Object> addCommits(User caller, UUID roomId, String branch, Integer count, Boolean beforeKickoff) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String branchName = (branch != null && !branch.isBlank()) ? branch.trim() : "main";
        int commitCount = (count != null && count > 0) ? count : 3;
        boolean preKickoff = Boolean.TRUE.equals(beforeKickoff);

        Instant baseTime;
        if (preKickoff) {
            baseTime = room.getEventStart() != null
                    ? room.getEventStart().minus(Duration.ofHours(2))
                    : clock.instant().minus(Duration.ofDays(2));
        } else {
            baseTime = clock.instant().minus(Duration.ofMinutes(10L * commitCount));
        }

        List<GithubCommit> created = new ArrayList<>();
        String[] sampleMessages = {
                "feat: add core pipeline runner",
                "fix: handle nil response in api adapter",
                "refactor: extract validation service",
                "docs: update setup and env guide",
                "test: add unit coverage for calculations"
        };

        for (int i = 0; i < commitCount; i++) {
            String sha = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            String msg = sampleMessages[i % sampleMessages.length] + " (#" + (i + 1) + ")";
            Instant commitTime = baseTime.plus(Duration.ofMinutes(5L * (i + 1)));

            GithubCommit c = new GithubCommit(
                    room.getId(),
                    sha,
                    msg,
                    caller.getName() != null ? caller.getName().toLowerCase(Locale.ROOT).replace(" ", "") : "dev",
                    caller.getName() != null ? caller.getName() : "Dev User",
                    caller.getId(),
                    commitTime,
                    12 + i * 4,
                    3 + i,
                    branchName
            );
            created.add(commitRepository.save(c));
        }

        branchRepository.findByRoomIdAndName(room.getId(), branchName).ifPresent(b -> {
            GithubCommit last = created.get(created.size() - 1);
            b.setLastCommitSha(last.getSha());
            b.setLastCommitMessage(last.getMessage());
            b.setLastCommitAt(last.getCommittedAt());
            branchRepository.save(b);
        });

        return Map.of("success", true, "added", created.size(), "branch", branchName, "beforeKickoff", preKickoff);
    }

    /**
     * Seeds complete presentation collateral: slides, Q&A, rehearsal run, demo insurance & media, submission draft.
     */
    @Transactional
    public Map<String, Object> seedPresent(User caller, UUID roomId) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        // 1. Pitch deck & default slides
        pitchDeckService.getDeck(roomId, caller);

        // 2. Sample Q&A
        if (pitchQaRepository.findByRoomIdOrderByPositionAsc(roomId).isEmpty()) {
            pitchQaRepository.saveAll(List.of(
                    new PitchQa(roomId, 0, "What did you build this weekend?", "An end-to-end hackathon operating system featuring Kanban, GitHub sync, API catalog, and pitch rehearsal tools.", "PRODUCT", "MANUAL", true, caller.getId()),
                    new PitchQa(roomId, 1, "Who exactly is this for?", "Hackathon hackers, organizers, and mentors who need high velocity with zero coordination overhead.", "IMPACT", "MANUAL", true, caller.getId()),
                    new PitchQa(roomId, 2, "What breaks first under load?", "The GitHub webhook sync under rapid team pushes, so we implemented rate-limited batching.", "TECH", "MANUAL", false, caller.getId())
            ));
        }

        // 3. Rehearsal run
        if (rehearsalRepository.findByRoomIdOrderByRunAtDesc(roomId).isEmpty()) {
            rehearsalRepository.save(new PitchRehearsal(
                    roomId,
                    clock.instant().minus(Duration.ofMinutes(25)),
                    175,
                    caller.getId(),
                    caller.getId(),
                    "[{\"slideId\":\"1\",\"paceSec\":25},{\"slideId\":\"2\",\"paceSec\":30},{\"slideId\":\"3\",\"paceSec\":40}]",
                    "Strong opener. Pacing was smooth across all key slides."
            ));
        }

        // 4. Demo insurance items & sections
        demoSeedService.seedFromPlan(room);

        // 5. Demo media
        if (demoMediaRepository.findById(roomId).isEmpty()) {
            demoMediaRepository.save(new DemoMedia(
                    roomId,
                    "https://youtube.com/watch?v=hackathon-os-demo",
                    "https://drive.google.com/hackathon-os-backup-recording",
                    clock.instant()
            ));
        }

        // 6. Submission draft
        if (submissionRepository.findById(roomId).isEmpty()) {
            submissionRepository.save(new Submission(
                    roomId,
                    "DRAFT",
                    "{\"whatItDoes\":\"[brackit] is an execution engine that keeps teams focused, aligned, and deadline-ready.\",\"whyItMatters\":\"Most hackathon teams fail due to misalignment and missed deadlines rather than lack of technical skill.\",\"howBuilt\":\"React, TypeScript, TailwindCSS, Spring Boot, PostgreSQL, Flyway.\",\"challenges\":\"Building deterministic attention rules and real-time state synchronisation across modules.\",\"whatsNext\":\"Multi-room tournaments and judge portals.\"}",
                    "[]",
                    clock.instant()
            ));
        }

        return Map.of("success", true, "message", "Present data seeded successfully");
    }

    private User getOrCreateFakeUser(FakePersona persona) {
        return userRepository.findByProviderAndProviderUserId("DEV", persona.email())
                .orElseGet(() -> {
                    User u = new User("DEV", persona.email(), persona.name(), persona.email(), null, null);
                    User saved = userRepository.save(u);
                    settingsRepository.save(new UserSettings(saved.getId(), persona.name()));
                    return saved;
                });
    }
}
