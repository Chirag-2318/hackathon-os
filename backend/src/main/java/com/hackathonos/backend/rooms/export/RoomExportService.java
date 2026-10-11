package com.hackathonos.backend.rooms.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.github.GithubBranch;
import com.hackathonos.backend.github.GithubBranchRepository;
import com.hackathonos.backend.github.GithubRepo;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.mvp.MvpState;
import com.hackathonos.backend.mvp.MvpStateRepository;
import com.hackathonos.backend.pitch.PitchDeck;
import com.hackathonos.backend.pitch.PitchDeckRepository;
import com.hackathonos.backend.pitch.PitchQa;
import com.hackathonos.backend.pitch.PitchQaRepository;
import com.hackathonos.backend.pitch.PitchSlide;
import com.hackathonos.backend.pitch.PitchSlideRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.submission.Submission;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class RoomExportService {

    private final RoomAccess roomAccess;
    private final DocRepository docRepository;
    private final com.hackathonos.backend.docs.DocVersionRepository docVersionRepository;
    private final IdeaRepository ideaRepository;
    private final BriefRepository briefRepository;
    private final PlanStepRepository planStepRepository;
    private final TaskRepository taskRepository;
    private final MvpStateRepository mvpStateRepository;
    private final PitchDeckRepository pitchDeckRepository;
    private final PitchSlideRepository pitchSlideRepository;
    private final PitchQaRepository pitchQaRepository;
    private final SubmissionRepository submissionRepository;
    private final GithubRepoRepository githubRepoRepository;
    private final GithubBranchRepository githubBranchRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public RoomExportService(RoomAccess roomAccess,
                             DocRepository docRepository,
                             com.hackathonos.backend.docs.DocVersionRepository docVersionRepository,
                             IdeaRepository ideaRepository,
                             BriefRepository briefRepository,
                             PlanStepRepository planStepRepository,
                             TaskRepository taskRepository,
                             MvpStateRepository mvpStateRepository,
                             PitchDeckRepository pitchDeckRepository,
                             PitchSlideRepository pitchSlideRepository,
                             PitchQaRepository pitchQaRepository,
                             SubmissionRepository submissionRepository,
                             GithubRepoRepository githubRepoRepository,
                             GithubBranchRepository githubBranchRepository,
                             RoomMemberRepository roomMemberRepository,
                             UserRepository userRepository,
                             ObjectMapper objectMapper) {
        this.roomAccess = roomAccess;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.ideaRepository = ideaRepository;
        this.briefRepository = briefRepository;
        this.planStepRepository = planStepRepository;
        this.taskRepository = taskRepository;
        this.mvpStateRepository = mvpStateRepository;
        this.pitchDeckRepository = pitchDeckRepository;
        this.pitchSlideRepository = pitchSlideRepository;
        this.pitchQaRepository = pitchQaRepository;
        this.submissionRepository = submissionRepository;
        this.githubRepoRepository = githubRepoRepository;
        this.githubBranchRepository = githubBranchRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Builds a comprehensive ZIP export of all room artifacts for offline venue resilience.
     */
    @Transactional(readOnly = true)
    public byte[] buildRoomExportZip(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {

            List<String> files = new ArrayList<>();
            addDocs(roomId, zos, files);
            addIdeas(roomId, zos, files);
            addBrief(roomId, zos, files);
            addPlan(roomId, zos, files);
            addBoard(roomId, zos, files);
            addMvp(roomId, zos, files);
            addPitch(roomId, zos, files);
            addSubmission(roomId, zos, files);
            addGithub(roomId, zos, files);
            addTeam(roomId, zos, files);

            // README.txt at root
            addReadme(room, files, zos);

            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate room export ZIP", e);
        }
    }

    private void addEntry(ZipOutputStream zos, String path, byte[] content, List<String> files) throws IOException {
        zos.putNextEntry(new ZipEntry(path));
        zos.write(content);
        zos.closeEntry();
        files.add(path);
    }

    private void addReadme(Room room, List<String> files, ZipOutputStream zos) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("Room: ").append(room.getName()).append("\n");
        sb.append("Exported At: ").append(Instant.now().toString()).append("\n\n");
        sb.append("Files included:\n");
        for (String f : files) {
            sb.append("- ").append(f).append("\n");
        }
        zos.putNextEntry(new ZipEntry("README.txt"));
        zos.write(sb.toString().getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private void addDocs(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        List<Doc> docs = docRepository.findByRoomIdOrderByFileNameAsc(roomId);
        for (Doc d : docs) {
            String path = "docs/" + (d.getFileName() != null ? d.getFileName() : "doc-" + d.getId() + ".md");
            List<com.hackathonos.backend.docs.DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(d.getId());
            String content = versions.isEmpty() ? "" : versions.get(0).getContent();
            addEntry(zos, path, content.getBytes(StandardCharsets.UTF_8), files);
        }
    }

    private void addIdeas(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        List<Idea> ideas = ideaRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
        StringBuilder sb = new StringBuilder("# Team Ideas\n\n");
        for (Idea i : ideas) {
            sb.append("## Idea ").append(i.getId()).append(i.isPrimary() ? " (PRIMARY)" : "").append("\n");
            sb.append("Status: ").append(i.getStatus()).append("\n\n");
            sb.append(i.getText() != null ? i.getText() : "").append("\n\n---\n\n");
        }
        addEntry(zos, "ideas.md", sb.toString().getBytes(StandardCharsets.UTF_8), files);
    }

    private void addBrief(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        String json = briefOpt.isPresent()
                ? objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(briefOpt.get())
                : "{}";
        addEntry(zos, "brief.json", json.getBytes(StandardCharsets.UTF_8), files);
    }

    private void addPlan(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        List<PlanStep> steps = planStepRepository.findByRoomId(roomId);
        StringBuilder sb = new StringBuilder("# Plan Answers\n\n");
        for (PlanStep s : steps) {
            sb.append("## Step: ").append(s.getStepKey()).append("\n\n");
            sb.append(s.getAnswer() != null ? s.getAnswer() : "").append("\n\n---\n\n");
        }
        addEntry(zos, "plan/answers.md", sb.toString().getBytes(StandardCharsets.UTF_8), files);
    }

    private void addBoard(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        List<Task> tasks = taskRepository.findByRoomId(roomId);
        tasks.sort(Comparator.comparingInt(Task::getPosition));

        StringBuilder csv = new StringBuilder("Key,Summary,Status,Assignee,Priority,Phase,EstimateMin,DueAt,RoleLabel\n");
        for (Task t : tasks) {
            csv.append(escapeCsv(t.getTaskKey())).append(",")
               .append(escapeCsv(t.getSummary())).append(",")
               .append(escapeCsv(t.getStatus())).append(",")
               .append(escapeCsv(t.getAssigneeId() != null ? t.getAssigneeId().toString() : "unassigned")).append(",")
               .append(escapeCsv(t.getPriority())).append(",")
               .append(escapeCsv(t.getPhaseId() != null ? t.getPhaseId().toString() : "")).append(",")
               .append(t.getEstimateMin()).append(",")
               .append(escapeCsv(t.getDueAt() != null ? t.getDueAt().toString() : "")).append(",")
               .append(escapeCsv(t.getRoleLabel() != null ? t.getRoleLabel() : "")).append("\n");
        }
        addEntry(zos, "board/tasks.csv", csv.toString().getBytes(StandardCharsets.UTF_8), files);

        String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(tasks);
        addEntry(zos, "board/tasks.json", json.getBytes(StandardCharsets.UTF_8), files);
    }

    private void addMvp(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        Optional<MvpState> mvpOpt = mvpStateRepository.findById(roomId);
        String json = mvpOpt.isPresent()
                ? objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(mvpOpt.get())
                : "{}";
        addEntry(zos, "mvp.json", json.getBytes(StandardCharsets.UTF_8), files);
    }

    private void addPitch(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        List<PitchSlide> slides = pitchSlideRepository.findByRoomIdOrderByPositionAsc(roomId);
        StringBuilder deck = new StringBuilder("# Pitch Deck\n\n");
        for (PitchSlide s : slides) {
            deck.append("## ").append(s.getTitle()).append(" [").append(s.getKind()).append("]\n");
            deck.append(s.getContent() != null ? s.getContent() : "").append("\n\n---\n\n");
        }
        addEntry(zos, "pitch/deck.md", deck.toString().getBytes(StandardCharsets.UTF_8), files);

        List<PitchQa> qas = pitchQaRepository.findByRoomIdOrderByPositionAsc(roomId);
        StringBuilder qa = new StringBuilder("# Pitch Q&A\n\n");
        for (PitchQa q : qas) {
            qa.append("### Q: ").append(q.getQuestion()).append("\n");
            qa.append("**A:** ").append(q.getAnswer() != null ? q.getAnswer() : "").append("\n\n");
        }
        addEntry(zos, "pitch/qa.md", qa.toString().getBytes(StandardCharsets.UTF_8), files);
    }

    private void addSubmission(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        Optional<Submission> subOpt = submissionRepository.findById(roomId);
        StringBuilder sb = new StringBuilder("# Submission Draft\n\n");
        if (subOpt.isPresent()) {
            Submission s = subOpt.get();
            sb.append("Status: ").append(s.getStatus()).append("\n\n");
            sb.append(s.getDraft() != null ? s.getDraft() : "").append("\n");
        }
        addEntry(zos, "submission/draft.md", sb.toString().getBytes(StandardCharsets.UTF_8), files);
    }

    private void addGithub(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        Optional<GithubRepo> repoOpt = githubRepoRepository.findById(roomId);
        List<GithubBranch> branches = githubBranchRepository.findByRoomId(roomId);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("repo", repoOpt.orElse(null));
        summary.put("branches", branches);
        String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(summary);
        addEntry(zos, "github/summary.json", json.getBytes(StandardCharsets.UTF_8), files);
    }

    private void addTeam(UUID roomId, ZipOutputStream zos, List<String> files) throws IOException {
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        StringBuilder csv = new StringBuilder("Name,Role\n");
        for (RoomMember m : members) {
            String name = userRepository.findById(m.getUserId()).map(User::getName).orElse("Teammate");
            csv.append(escapeCsv(name)).append(",").append(escapeCsv(m.getRole())).append("\n");
        }
        addEntry(zos, "team/members.csv", csv.toString().getBytes(StandardCharsets.UTF_8), files);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
