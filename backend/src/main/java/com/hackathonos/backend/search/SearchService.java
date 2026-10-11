package com.hackathonos.backend.search;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.search.SearchDtos.*;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class SearchService {

    private final RoomRepository roomRepository;
    private final TaskRepository taskRepository;
    private final DocRepository docRepository;
    private final BriefRepository briefRepository;

    public SearchService(
            RoomRepository roomRepository,
            TaskRepository taskRepository,
            DocRepository docRepository,
            BriefRepository briefRepository
    ) {
        this.roomRepository = roomRepository;
        this.taskRepository = taskRepository;
        this.docRepository = docRepository;
        this.briefRepository = briefRepository;
    }

    /**
     * Executes member-scoped search across tasks, docs, brief rules, and rooms.
     */
    @Transactional(readOnly = true)
    public SearchResponseDto search(String query, UUID roomId, User user) {
        if (query == null || query.trim().length() < 2) {
            return new SearchResponseDto(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList()
            );
        }

        String q = query.trim().toLowerCase();

        List<Room> activeRooms = roomRepository.findActiveRoomsByMemberUserId(user.getId());
        List<Room> targetRooms = new ArrayList<>();
        for (Room r : activeRooms) {
            if (roomId == null || r.getId().equals(roomId)) {
                targetRooms.add(r);
            }
        }

        if (targetRooms.isEmpty()) {
            return new SearchResponseDto(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList()
            );
        }

        Map<UUID, String> roomNames = new HashMap<>();
        for (Room r : targetRooms) {
            roomNames.put(r.getId(), r.getName());
        }

        List<SearchTaskDto> tasks = new ArrayList<>();
        List<SearchDocDto> docs = new ArrayList<>();
        List<SearchRuleDto> rules = new ArrayList<>();
        List<SearchRoomDto> rooms = new ArrayList<>();

        // Rooms search
        for (Room r : targetRooms) {
            if (r.getName() != null && r.getName().toLowerCase().contains(q)) {
                rooms.add(new SearchRoomDto(r.getId(), r.getName()));
                if (rooms.size() >= 5) break;
            }
        }

        // Tasks & Docs & Brief Rules search
        for (Room r : targetRooms) {
            UUID rId = r.getId();
            String rName = r.getName();

            // Tasks
            if (tasks.size() < 5) {
                List<Task> roomTasks = taskRepository.findByRoomId(rId);
                for (Task t : roomTasks) {
                    boolean match = (t.getTaskKey() != null && t.getTaskKey().toLowerCase().contains(q))
                            || (t.getSummary() != null && t.getSummary().toLowerCase().contains(q))
                            || (t.getDescription() != null && t.getDescription().toLowerCase().contains(q));
                    if (match) {
                        tasks.add(new SearchTaskDto(rId, rName, t.getTaskKey(), t.getSummary(), t.getStatus()));
                        if (tasks.size() >= 5) break;
                    }
                }
            }

            // Docs
            if (docs.size() < 5) {
                List<Doc> roomDocs = docRepository.findByRoomId(rId);
                for (Doc d : roomDocs) {
                    boolean match = (d.getFileName() != null && d.getFileName().toLowerCase().contains(q))
                            || (d.getTitle() != null && d.getTitle().toLowerCase().contains(q));
                    if (match) {
                        docs.add(new SearchDocDto(rId, rName, d.getFileName(), d.getTitle()));
                        if (docs.size() >= 5) break;
                    }
                }
            }

            // Rules in Brief
            if (rules.size() < 5) {
                Optional<Brief> briefOpt = briefRepository.findByRoomId(rId);
                if (briefOpt.isPresent()) {
                    Brief b = briefOpt.get();
                    checkRuleField(rules, rId, rName, "Problem statement", b.getProblemStatement(), q);
                    checkRuleField(rules, rId, rName, "Eligibility", b.getEligibility(), q);
                    checkRuleField(rules, rId, rName, "Tech rules", b.getTechRules(), q);
                    checkRuleField(rules, rId, rName, "AI policy", b.getAiPolicy(), q);
                    checkRuleField(rules, rId, rName, "Judging format", b.getJudgingFormat(), q);
                    checkRuleField(rules, rId, rName, "Deliverables", b.getDeliverables(), q);
                    checkRuleField(rules, rId, rName, "Tracks & prizes", b.getTracksAndPrizes(), q);
                }
            }
        }

        return new SearchResponseDto(tasks, docs, rules, rooms);
    }

    private void checkRuleField(List<SearchRuleDto> rules, UUID roomId, String roomName, String fieldName, String value, String q) {
        if (rules.size() >= 5 || value == null) return;
        int idx = value.toLowerCase().indexOf(q);
        if (idx >= 0) {
            int start = Math.max(0, idx - 40);
            int end = Math.min(value.length(), idx + q.length() + 40);
            String snippet = (start > 0 ? "..." : "") + value.substring(start, end).trim() + (end < value.length() ? "..." : "");
            rules.add(new SearchRuleDto(roomId, roomName, fieldName, snippet));
        }
    }
}
