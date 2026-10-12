package com.hackathonos.backend.mvp;

import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MvpSeedService {

    private final MvpStateRepository mvpStateRepository;
    private final MvpFlowStepRepository flowStepRepository;
    private final MvpLedgerRowRepository ledgerRowRepository;
    private final MvpCutItemRepository cutItemRepository;
    private final PlanStepRepository stepRepository;

    public MvpSeedService(
            MvpStateRepository mvpStateRepository,
            MvpFlowStepRepository flowStepRepository,
            MvpLedgerRowRepository ledgerRowRepository,
            MvpCutItemRepository cutItemRepository,
            PlanStepRepository stepRepository
    ) {
        this.mvpStateRepository = mvpStateRepository;
        this.flowStepRepository = flowStepRepository;
        this.ledgerRowRepository = ledgerRowRepository;
        this.cutItemRepository = cutItemRepository;
        this.stepRepository = stepRepository;
    }

    @Transactional
    public void cleanForRoom(UUID roomId) {
        mvpStateRepository.deleteById(roomId);
        flowStepRepository.deleteByRoomId(roomId);
        ledgerRowRepository.deleteByRoomId(roomId);
        cutItemRepository.deleteByRoomId(roomId);
    }

    /**
     * Seeds initial MVP state, core flow, reality ledger, and cut list from validated PRD plan step.
     */
    @Transactional
    public void seedFromPlan(Room room) {
        if (mvpStateRepository.existsById(room.getId())) {
            return;
        }

        Optional<PlanStep> prdStepOpt = stepRepository.findByRoomIdAndStepKey(room.getId(), "prd");
        if (prdStepOpt.isEmpty() || !prdStepOpt.get().isValidated() || prdStepOpt.get().getAnswer() == null) {
            return;
        }

        String answer = prdStepOpt.get().getAnswer();
        String identity = extractSection(answer, "## One-sentence identity", "## Core flow");
        if (identity == null || identity.isBlank()) {
            identity = extractSection(answer, "## One-sentence identity", "##");
        }
        if (identity != null && identity.length() > 200) {
            identity = identity.substring(0, 197) + "...";
        }

        String wow = extractSection(answer, "## Wow moment", "##");
        if (wow != null && wow.length() > 400) {
            wow = wow.substring(0, 397) + "...";
        }

        MvpState state = new MvpState(room.getId(), identity != null ? identity.trim() : "", wow != null ? wow.trim() : "");
        state.setUpdatedAt(Instant.now());
        mvpStateRepository.save(state);

        seedCoreFlow(room.getId(), answer);
        seedLedger(room.getId(), answer);
        seedCutList(room.getId(), answer);
    }

    private void seedCoreFlow(UUID roomId, String answer) {
        String cfText = extractSection(answer, "## Core flow", "## Wow moment");
        if (cfText == null) cfText = extractSection(answer, "## Core flow", "##");
        if (cfText == null) return;

        List<String> steps = new ArrayList<>();
        for (String line : cfText.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.matches("^\\d+\\.\\s+.*")) {
                String title = trimmed.replaceFirst("^\\d+\\.\\s+", "").trim();
                if (!title.isBlank()) {
                    if (title.length() > 120) title = title.substring(0, 117) + "...";
                    steps.add(title);
                }
            }
        }

        int pos = 0;
        for (String stepTitle : steps) {
            flowStepRepository.save(new MvpFlowStep(roomId, pos++, stepTitle, "NOT_YET", null));
            if (pos >= 5) break;
        }
    }

    private void seedLedger(UUID roomId, String answer) {
        String ledgerText = extractSection(answer, "## Real vs mocked", "## Cut list");
        if (ledgerText == null) ledgerText = extractSection(answer, "## Real vs mocked", "##");
        if (ledgerText == null) return;

        int pos = 0;
        for (String line : ledgerText.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("|") && !trimmed.contains("---") && !trimmed.toLowerCase().contains("component")) {
                String[] parts = trimmed.split("\\|");
                if (parts.length >= 3) {
                    String partName = parts[1].trim();
                    String statusStr = parts[2].trim().toLowerCase();
                    String notes = parts.length > 3 ? parts[3].trim() : null;

                    String status = "PLANNED";
                    if (statusStr.contains("built")) status = "BUILT";
                    else if (statusStr.contains("existing") || statusStr.contains("api")) status = "EXISTING";
                    else if (statusStr.contains("mocked")) status = "MOCKED";

                    if (!partName.isBlank()) {
                        ledgerRowRepository.save(new MvpLedgerRow(roomId, pos++, partName, status, null, null, notes));
                    }
                }
            }
            if (pos >= 40) break;
        }
    }

    private void seedCutList(UUID roomId, String answer) {
        String cutText = extractSection(answer, "## Cut list", "##");
        if (cutText == null) return;

        int pos = 0;
        for (String line : cutText.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                String text = trimmed.substring(1).trim();
                if (!text.isBlank()) {
                    if (text.length() > 255) text = text.substring(0, 252) + "...";
                    cutItemRepository.save(new MvpCutItem(roomId, pos++, text, true));
                }
            }
            if (pos >= 20) break;
        }
    }

    private String extractSection(String content, String startHeader, String nextHeader) {
        int start = content.indexOf(startHeader);
        if (start == -1) return null;
        start += startHeader.length();

        int end = -1;
        if (nextHeader.equals("##")) {
            Matcher m = Pattern.compile("\n##\\s").matcher(content.substring(start));
            if (m.find()) end = start + m.start();
        } else {
            end = content.indexOf(nextHeader, start);
        }

        String raw = end != -1 ? content.substring(start, end) : content.substring(start);
        return raw.trim();
    }
}
