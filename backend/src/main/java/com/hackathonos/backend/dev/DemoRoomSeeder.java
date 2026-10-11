package com.hackathonos.backend.dev;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
@Profile("dev")
public class DemoRoomSeeder {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final BriefRepository briefRepository;
    private final TaskRepository taskRepository;
    private final DevService devService;
    private final ActivityLogger activityLogger;
    private final EventTemplateService templateService;

    public DemoRoomSeeder(RoomRepository roomRepository,
                          RoomMemberRepository memberRepository,
                          RoomMemberSkillRepository skillRepository,
                          BriefRepository briefRepository,
                          TaskRepository taskRepository,
                          DevService devService,
                          ActivityLogger activityLogger,
                          EventTemplateService templateService) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.briefRepository = briefRepository;
        this.taskRepository = taskRepository;
        this.devService = devService;
        this.activityLogger = activityLogger;
        this.templateService = templateService;
    }

    @Transactional
    public Map<String, Object> seedDemoRoom(User caller) {
        Room room = createOrResetDemoRoom(caller);
        UUID roomId = room.getId();

        ensureLeaderMember(room, caller);
        devService.addFakeMembers(caller, roomId, null);
        ensureBrief(room, caller);
        devService.seedIdeas(caller, roomId);
        seedTasks(room, caller);
        devService.seedPresent(caller, roomId);

        activityLogger.log(room, caller, "DEV_DEMO_ROOM_SEEDED", "Demo room seeded with full end-to-end dataset");

        return Map.of(
                "id", roomId.toString(),
                "name", room.getName(),
                "stage", room.getStage(),
                "joinCode", room.getJoinCode(),
                "message", "Demo room seeded successfully with members, brief, ideas, tasks, and presentation data"
        );
    }

    private Room createOrResetDemoRoom(User caller) {
        String joinCode = "D" + UUID.randomUUID().toString().substring(0, 3).toUpperCase();
        Instant now = Instant.now();
        Instant eventStart = now.minus(39, ChronoUnit.HOURS);
        Instant eventEnd = now.plus(9, ChronoUnit.HOURS);

        EventTemplate template = templateService.getOrThrow("online-48h");

        Room room = new Room(
                "Campus Build Sprint 2026",
                "48-Hour Campus Hackathon Demo Workspace",
                "An end-to-end resilient execution operating system for hackathon teams.",
                template.getId(),
                caller.getId(),
                eventStart,
                eventEnd,
                "UTC",
                "HOS",
                joinCode
        );
        room.setStage("build");
        room.setBriefDone(true);
        room.setIdeateDone(true);
        room.setPlanDone(true);
        room.setBuildStartedAt(eventStart.plus(12, ChronoUnit.HOURS));
        return roomRepository.save(room);
    }

    private void ensureLeaderMember(Room room, User caller) {
        Optional<RoomMember> existing = memberRepository.findByRoomIdAndUserId(room.getId(), caller.getId());
        if (existing.isEmpty()) {
            RoomMember leader = new RoomMember(room.getId(), caller.getId(), "LEADER");
            leader = memberRepository.save(leader);
            skillRepository.save(new RoomMemberSkill(leader.getId(), "Backend"));
            skillRepository.save(new RoomMemberSkill(leader.getId(), "Frontend"));
        }
    }

    private void ensureBrief(Room room, User caller) {
        if (briefRepository.findByRoomId(room.getId()).isPresent()) return;

        Brief brief = new Brief(room.getId(), "manual");
        brief.setProblemStatement("Hackathon teams lose precious hours debating tech, branch conflicts, and last-minute presentation panic.");
        brief.setTargetAudience("Hackathon builders, college sprint teams, and weekend creators under strict time crunches.");
        brief.setTechRules("All original source code must be created within the 48-hour event duration.");
        brief.setAiPolicy("Generative AI models allowed for ideation and boilerplate; final core code must be understood and defensible.");
        brief.setJudgingFormat("3-minute live pitch with slide deck, live demo, and 2-minute technical Q&A.");
        brief.setConfirmed(true);
        brief.setConfirmedBy(caller.getId());
        brief.setConfirmedAt(Instant.now());
        briefRepository.save(brief);
    }

    private void seedTasks(Room room, User caller) {
        if (!taskRepository.findByRoomIdOrderByPositionAsc(room.getId()).isEmpty()) return;

        List<TaskSeedData> taskTemplates = List.of(
                new TaskSeedData("HOS-1", 1, "Finalize PostgreSQL schema and Flyway migrations", "DONE", "HIGHEST", "Backend", 60),
                new TaskSeedData("HOS-2", 2, "Build SSE real-time event hub and reconnection logic", "DONE", "HIGH", "Backend", 90),
                new TaskSeedData("HOS-3", 3, "Implement pitch rehearsal timer and rubric matrix", "IN_PROGRESS", "HIGH", "Frontend", 120),
                new TaskSeedData("HOS-4", 4, "Verify submission checklist and zip export package", "IN_PROGRESS", "MEDIUM", "QA", 45),
                new TaskSeedData("HOS-5", 5, "Conduct dry-run pitch presentation with judge simulator", "TODO", "MEDIUM", "Presenter", 60),
                new TaskSeedData("HOS-6", 6, "Polish dark mode styling and accessibility micro-interactions", "TODO", "LOW", "Design", 30)
        );

        int pos = 0;
        for (TaskSeedData td : taskTemplates) {
            Task task = new Task(
                    room.getId(),
                    td.key(),
                    td.number(),
                    td.summary(),
                    "Generated demonstration task representing production sprint progress.",
                    td.status(),
                    caller.getId(),
                    caller.getId(),
                    td.priority(),
                    null,
                    td.roleLabel(),
                    td.estimateMin(),
                    Instant.now().plus(4, ChronoUnit.HOURS),
                    pos++,
                    "PLAN"
            );
            if ("DONE".equals(td.status())) {
                task.setCompletedAt(Instant.now().minus(2, ChronoUnit.HOURS));
            }
            taskRepository.save(task);
        }
        room.setTaskCounter(pos);
        roomRepository.save(room);
    }

    private record TaskSeedData(String key, int number, String summary, String status, String priority, String roleLabel, int estimateMin) {}
}
