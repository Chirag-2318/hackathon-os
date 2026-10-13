package com.hackathonos.backend.dev;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.pitch.PitchDeck;
import com.hackathonos.backend.pitch.PitchDeckRepository;
import com.hackathonos.backend.pitch.PitchSlide;
import com.hackathonos.backend.pitch.PitchSlideRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Profile("dev")
public class DevSeedService {

    private final boolean seedEnabled;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final IdeaRepository ideaRepository;
    private final PlanStepRepository planStepRepository;
    private final BriefRepository briefRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final PitchDeckRepository pitchDeckRepository;
    private final PitchSlideRepository pitchSlideRepository;
    private final CheckpointService checkpointService;

    public DevSeedService(
            @Value("${app.seed.enabled:false}") boolean seedEnabled,
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            IdeaRepository ideaRepository,
            PlanStepRepository planStepRepository,
            BriefRepository briefRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            PitchDeckRepository pitchDeckRepository,
            PitchSlideRepository pitchSlideRepository,
            CheckpointService checkpointService
    ) {
        this.seedEnabled = seedEnabled;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.ideaRepository = ideaRepository;
        this.planStepRepository = planStepRepository;
        this.briefRepository = briefRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.pitchDeckRepository = pitchDeckRepository;
        this.pitchSlideRepository = pitchSlideRepository;
        this.checkpointService = checkpointService;
    }

    public boolean isEnabled() {
        return seedEnabled;
    }

    @Transactional
    public UUID createDemoRoom(User creator) {
        // 1. Resolve 3 fake seed teammates
        User alice = resolveSeedUser("seed_alice", "Alice Chen", "alice@seed.hackathonos.dev", "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice");
        User bob = resolveSeedUser("seed_bob", "Bob Kumar", "bob@seed.hackathonos.dev", "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob");
        User carol = resolveSeedUser("seed_carol", "Carol Diaz", "carol@seed.hackathonos.dev", "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol");

        // 2. Setup room starting 20 hours ago
        Instant startsAt = Instant.now().minus(20, ChronoUnit.HOURS);
        Instant endsAt = startsAt.plus(36, ChronoUnit.HOURS);
        Instant freezeAt = startsAt.plus(25, ChronoUnit.HOURS); // 70% of 36h

        Room room = new Room(
                "HealthPulse AI (SIH Demo)",
                "Automated clinical triage and bedside telemetry monitor with smart judge Q&A",
                "Computer vision and time-series telemetry alerting for emergency triage wards",
                "sih-36h",
                creator.getId(),
                startsAt,
                endsAt,
                "Asia/Kolkata",
                "PULSE",
                "DEMO2026"
        );
        room.setDurationHours(36);
        room.setFreezeAt(freezeAt);
        room.setStage("build");
        room.setWorkflowStage("BUILD");
        room.setBriefDone(true);
        room.setIdeateDone(true);
        room.setPlanDone(true);
        roomRepository.save(room);

        // 3. Members
        memberRepository.save(new RoomMember(room.getId(), creator.getId(), "LEADER"));
        memberRepository.save(new RoomMember(room.getId(), alice.getId(), "MEMBER"));
        memberRepository.save(new RoomMember(room.getId(), bob.getId(), "MEMBER"));
        memberRepository.save(new RoomMember(room.getId(), carol.getId(), "MEMBER"));

        // 4. Brief (confirmed)
        Brief brief = new Brief(room.getId(), "paste");
        brief.setProblemStatement("Emergency triage delays cause critical care bottlenecks. We build an automated bedside vitals computer vision pipeline.");
        brief.setTargetAudience("Emergency nurses, clinical directors, on-call resident doctors");
        brief.setConfirmed(true);
        brief.setConfirmedAt(startsAt.plus(1, ChronoUnit.HOURS));
        brief.setConfirmedBy(creator.getId());
        briefRepository.save(brief);

        // 5. Checkpoints
        checkpointService.createForRoom(room);

        // 6. 3 Accepted Ideas
        Idea i1 = new Idea(room.getId(), creator.getId(), "Real-time vitals optical flow: Track respiratory frequency from contactless camera stream");
        i1.setStatus("APPROVED");
        ideaRepository.save(i1);

        Idea i2 = new Idea(room.getId(), alice.getId(), "Offline-first sync queue: Local IndexedDB caching for venue network drop resilience");
        i2.setStatus("APPROVED");
        ideaRepository.save(i2);

        Idea i3 = new Idea(room.getId(), bob.getId(), "Clinician audio alert buzzer: Tone synthesized web audio alarm when vitals drift beyond safety margins");
        i3.setStatus("APPROVED");
        ideaRepository.save(i3);

        // 7. 5 Validated Plan Steps
        for (String stepKey : List.of("prd", "tech", "phases", "tasks", "demo")) {
            PlanStep step = new PlanStep(room.getId(), stepKey);
            step.setValidated(true);
            step.setAnswer("{\"validated\": true, \"summary\": \"Demo validated step for " + stepKey + "\"}");
            planStepRepository.save(step);
        }

        // 8. 8 Tasks across statuses and assignees
        createTask(room.getId(), "PULSE-1", 1, "Setup WebSocket vitals ingest gateway", "DONE", creator.getId());
        createTask(room.getId(), "PULSE-2", 2, "Implement contactless respiratory rate optical estimator", "DONE", alice.getId());
        createTask(room.getId(), "PULSE-3", 3, "Create ECG waveform real-time canvas chart", "DONE", creator.getId());
        createTask(room.getId(), "PULSE-4", 4, "Connect nurse call bell audio notification synthesis", "IN_PROGRESS", bob.getId());
        createTask(room.getId(), "PULSE-5", 5, "Implement ward bed allocation grid UI", "IN_PROGRESS", carol.getId());
        createTask(room.getId(), "PULSE-6", 6, "Calibrate judge simulator threshold metrics", "IN_PROGRESS", alice.getId());
        createTask(room.getId(), "PULSE-7", 7, "Draft 3-minute pitch slide walkthrough script", "TODO", creator.getId());
        createTask(room.getId(), "PULSE-8", 8, "Record offline backup demo video with fallback audio", "TODO", null);

        // 9. Docs
        Doc docPrd = new Doc(room.getId(), "PRD.md", "Product Requirements Document", 1);
        docPrd.setLastEditedBy(creator.getId());
        docRepository.save(docPrd);
        docVersionRepository.save(new DocVersion(docPrd.getId(), 1, "# HealthPulse AI PRD\n\nContactless emergency ward bedside triage assistant.", "Initial PRD", creator.getId()));

        Doc docTech = new Doc(room.getId(), "TECH_STACK.md", "System Architecture & Stack", 1);
        docTech.setLastEditedBy(bob.getId());
        docRepository.save(docTech);
        docVersionRepository.save(new DocVersion(docTech.getId(), 1, "# Technology Stack\n\n- React + Vite + Tailwind\n- Spring Boot 4 + WebSockets\n- PostgreSQL", "Tech Architecture", bob.getId()));

        // 10. Pitch kit
        PitchDeck deck = new PitchDeck(room.getId(), "live_3min", Instant.now());
        pitchDeckRepository.save(deck);
        pitchSlideRepository.save(new PitchSlide(room.getId(), 1, "PROBLEM", "The Problem", "What hurts?", "Nurses lose 14 minutes per triage cycle"));
        pitchSlideRepository.save(new PitchSlide(room.getId(), 2, "SOLUTION", "Our Solution", "How do we fix it?", "Zero-contact camera telemetry with 98% accuracy"));
        pitchSlideRepository.save(new PitchSlide(room.getId(), 3, "DEMO", "HealthPulse AI", "Does it work live?", "Live telemetry inference running in browser"));

        return room.getId();
    }

    @Transactional
    public void deleteDemoRooms(User user) {
        List<Room> demoRooms = roomRepository.findByOwnerId(user.getId()).stream()
                .filter(r -> "DEMO2026".equalsIgnoreCase(r.getJoinCode()) || r.getName().contains("HealthPulse AI"))
                .toList();
        for (Room r : demoRooms) {
            taskRepository.deleteByRoomId(r.getId());
            memberRepository.deleteByRoomId(r.getId());
            roomRepository.delete(r);
        }
    }

    private User resolveSeedUser(String username, String name, String email, String avatar) {
        return userRepository.findByUsernameIgnoreCase(username).orElseGet(() -> {
            User u = new User("github", "seed-" + username, name, email, avatar, username);
            u.setUsername(username);
            return userRepository.save(u);
        });
    }

    private void createTask(UUID roomId, String key, int num, String summary, String status, UUID assigneeId) {
        Task t = new Task(roomId, key, num, summary, "Seed demo task for testing live board flow", status, assigneeId, null, "HIGH", null, "Dev", 60, null, num, "PLAN");
        if ("DONE".equalsIgnoreCase(status)) {
            t.setCompletedAt(Instant.now().minus(2, ChronoUnit.HOURS));
        }
        taskRepository.save(t);
    }
}
