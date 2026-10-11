package com.hackathonos.backend.plan;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Builds standard server-side prompts and expected format specifications for all 5 plan steps.
 */
@Component
public class PromptBuilder {

    public String buildCommonHeader(Room room, Brief brief, List<BriefRubricItem> rubric, List<RoomMember> members, Map<java.util.UUID, User> users) {
        String problem = (brief != null && brief.getProblemStatement() != null && !brief.getProblemStatement().isBlank())
                ? brief.getProblemStatement() : "not provided";

        StringBuilder rubricSb = new StringBuilder();
        if (rubric != null && !rubric.isEmpty()) {
            for (BriefRubricItem r : rubric) {
                if (!rubricSb.isEmpty()) rubricSb.append(", ");
                rubricSb.append(r.getCriterion()).append(" (").append(r.getWeight()).append("%)");
            }
        } else {
            rubricSb.append("not provided");
        }

        StringBuilder teamSb = new StringBuilder();
        if (members != null && !members.isEmpty()) {
            for (RoomMember m : members) {
                User u = users.get(m.getUserId());
                String name = u != null ? (u.getName() != null ? u.getName() : (u.getEmail() != null ? u.getEmail() : "Member")) : "Member";
                if (!teamSb.isEmpty()) teamSb.append(", ");
                teamSb.append(name).append(": ").append(m.getRole());
            }
        } else {
            teamSb.append("Solo builder");
        }

        long hours = 36;
        if (room.getEventStart() != null && room.getEventEnd() != null) {
            hours = Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours());
        }

        return "You are an expert hackathon mentor and product manager. I am building a project for the hackathon below. The file ideas.md is attached; use it as the source of truth.\n"
                + "Hackathon: " + room.getName() + ".\n"
                + "Problem statement: " + problem + ".\n"
                + "Rubric: " + rubricSb + ".\n"
                + "Team: " + teamSb + ".\n"
                + "Time available: " + hours + " hours.\n"
                + "Reply ONLY in the exact format below, with no extra commentary.\n\n";
    }

    public String getExpectedFormatPrd() {
        return """
# PRD
## Problem
## Target user
## One-sentence identity
## Core flow
1. Step one
2. Step two
3. Step three
4. Step four
## Wow moment
## Must-have features
## Out of scope
# MVP
## The one end-to-end flow
## Real vs mocked
| Part | Status |
| --- | --- |
| Core Flow | Built |
| External Data | Existing API |
| Complex Edge Cases | Mocked |
## Cut list
- Cut feature 1
- Cut feature 2
- Cut feature 3
## Risks and fallbacks""";
    }

    public String getExpectedFormatTech() {
        return """
# Tech stack
| Layer | Choice | Why | Team knows it? |
| --- | --- | --- | --- |
| Frontend | React + Vite | Fast build and reactive | Known |
| Backend | Spring Boot | Robust concurrency and clean REST | Known |
| Database | PostgreSQL | ACID compliance and Flyway | Known |
| Styling | TailwindCSS | Rapid responsive UI | Known |

# Architecture
The client communicates with the backend REST API over HTTPS.

```mermaid
graph TD
    Client[Web App] --> API[REST API]
    API --> DB[(PostgreSQL)]
```

# New-tech risks""";
    }

    public String getExpectedFormatPhases() {
        return """
reply ONLY with a JSON array of { "id": "p1", "name": string, "startPct": number, "endPct": number, "exitCheckpoint": string, "goals": [string] } covering 0 to 100 contiguously, at least 5 phases, matching the event length in hours, including a feature-freeze phase and a rehearsal phase.""";
    }

    public String getExpectedFormatTasks() {
        return """
reply ONLY with a JSON array of { "id": "t1", "title": string, "phaseId": string, "role": string, "estimateMin": number, "dependsOn": [string], "acceptance": string } where role is one of the team roles and skills listed above.""";
    }

    public String getExpectedFormatDemo() {
        return """
# Demo script
- [0-20s] Hook and real-world problem
- [20-60s] Live end-to-end user walk-through
- [60-90s] Technical highlight and wow moment

# Shot list
1. Problem intro on landing hero
2. Core interaction trigger
3. Live success result screen

# Likely judge Q&A
1. Q: What did you build this weekend?
A: We built the end-to-end execution system.
2. Q: What breaks first?
A: Peak concurrent load on the live web socket adapter.
3. Q: How does this solve the target user problem?
A: It eliminates manual coordination bottlenecks.
4. Q: Why did you choose this tech stack?
A: For fast developer velocity and verified reliability.
5. Q: What was the hardest technical challenge?
A: Integrating the real-time state machine.
6. Q: What is your secret sauce or wow moment?
A: Instant multi-party project sync.
7. Q: How do you handle edge cases and failure?
A: Graceful fallbacks and user recovery hints.
8. Q: What would you build with two more weeks?
A: Native desktop notifications and mobile views.""";
    }

    public String buildPromptForStep(String stepKey, Room room, Brief brief, List<BriefRubricItem> rubric, List<RoomMember> members, Map<java.util.UUID, User> users, Map<String, String> validatedAnswers) {
        String header = buildCommonHeader(room, brief, rubric, members, users);
        StringBuilder sb = new StringBuilder(header);

        switch (stepKey.toLowerCase()) {
            case "prd" -> sb.append(getExpectedFormatPrd());
            case "tech" -> {
                if (validatedAnswers.containsKey("prd")) {
                    sb.append("Validated PRD Answer:\n").append(validatedAnswers.get("prd")).append("\n\n");
                }
                sb.append(getExpectedFormatTech());
            }
            case "phases" -> {
                if (validatedAnswers.containsKey("prd")) {
                    sb.append("Validated PRD Answer:\n").append(validatedAnswers.get("prd")).append("\n\n");
                }
                if (validatedAnswers.containsKey("tech")) {
                    sb.append("Validated Tech Answer:\n").append(validatedAnswers.get("tech")).append("\n\n");
                }
                sb.append(getExpectedFormatPhases());
            }
            case "tasks" -> {
                if (validatedAnswers.containsKey("phases")) {
                    sb.append("Validated Phases Answer:\n").append(validatedAnswers.get("phases")).append("\n\n");
                }
                sb.append(getExpectedFormatTasks());
            }
            case "demo" -> {
                if (validatedAnswers.containsKey("prd")) {
                    sb.append("Validated PRD Answer:\n").append(validatedAnswers.get("prd")).append("\n\n");
                }
                sb.append(getExpectedFormatDemo());
            }
            default -> sb.append(getExpectedFormatPrd());
        }

        return sb.toString();
    }
}
