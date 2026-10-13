package com.hackathonos.backend.plan;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;

/**
 * Builds standard server-side prompts and expected format specifications for all 5 plan steps
 * incorporating real context: brief raw text (first 12,000 chars), structured fields, approved ideas with authors,
 * plan notes, team skills, and event hours.
 */
@Component
public class PromptBuilder {

    public String buildCommonHeader(
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<RoomMember> members,
            Map<UUID, User> users,
            Map<UUID, List<String>> memberSkillsMap,
            List<Idea> approvedIdeas,
            Map<UUID, String> authorNamesMap
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert hackathon mentor and product manager.\n");
        sb.append("Hackathon: ").append(room.getName()).append(".\n");

        long hours = 36;
        if (room.getEventStart() != null && room.getEventEnd() != null) {
            hours = Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours());
        }
        sb.append("Total event duration: ").append(hours).append(" hours.\n\n");

        // Plan notes
        if (room.getPlanNotes() != null && !room.getPlanNotes().isBlank()) {
            sb.append("=== Project Notes & Context ===\n")
                    .append(room.getPlanNotes().trim())
                    .append("\n\n");
        }

        // Team and skills
        sb.append("=== Team & Skills ===\n");
        if (members != null && !members.isEmpty()) {
            for (RoomMember m : members) {
                User u = users != null ? users.get(m.getUserId()) : null;
                String name = u != null && u.getName() != null && !u.getName().isBlank()
                        ? u.getName()
                        : (u != null && u.getEmail() != null ? u.getEmail() : "Member");
                List<String> skills = memberSkillsMap != null ? memberSkillsMap.getOrDefault(m.getId(), Collections.emptyList()) : Collections.emptyList();
                sb.append("- ").append(name).append(" (Role: ").append(m.getRole());
                if (!skills.isEmpty()) {
                    sb.append(", Skills: ").append(String.join(", ", skills));
                }
                sb.append(")\n");
            }
        } else {
            sb.append("Solo builder\n");
        }
        sb.append("\n");

        // Approved ideas with author name
        if (approvedIdeas != null && !approvedIdeas.isEmpty()) {
            sb.append("=== Approved Ideas ===\n");
            for (Idea idea : approvedIdeas) {
                String author = authorNamesMap != null ? authorNamesMap.getOrDefault(idea.getAuthorId(), "Team Member") : "Team Member";
                sb.append("- [").append(author).append("]: ").append(idea.getText().trim()).append("\n");
            }
            sb.append("\n");
        }

        // Structured brief fields
        if (brief != null) {
            sb.append("=== Hackathon Structured Brief ===\n");
            if (brief.getProblemStatement() != null && !brief.getProblemStatement().isBlank()) {
                sb.append("Problem Statement: ").append(brief.getProblemStatement().trim()).append("\n");
            }
            if (brief.getTargetAudience() != null && !brief.getTargetAudience().isBlank()) {
                sb.append("Target Audience: ").append(brief.getTargetAudience().trim()).append("\n");
            }
            if (brief.getTechRules() != null && !brief.getTechRules().isBlank()) {
                sb.append("Tech Rules: ").append(brief.getTechRules().trim()).append("\n");
            }
            if (brief.getAiPolicy() != null && !brief.getAiPolicy().isBlank()) {
                sb.append("AI Policy: ").append(brief.getAiPolicy().trim()).append("\n");
            }
            if (brief.getJudgingFormat() != null && !brief.getJudgingFormat().isBlank()) {
                sb.append("Judging Format: ").append(brief.getJudgingFormat().trim()).append("\n");
            }
            if (brief.getDeliverables() != null && !brief.getDeliverables().isBlank()) {
                sb.append("Deliverables: ").append(brief.getDeliverables().trim()).append("\n");
            }
            if (brief.getTracksAndPrizes() != null && !brief.getTracksAndPrizes().isBlank()) {
                sb.append("Tracks & Prizes: ").append(brief.getTracksAndPrizes().trim()).append("\n");
            }
            if (brief.getRisks() != null && !brief.getRisks().isBlank()) {
                sb.append("Risks: ").append(brief.getRisks().trim()).append("\n");
            }
            if (rubric != null && !rubric.isEmpty()) {
                sb.append("Rubric Criteria: ");
                for (int i = 0; i < rubric.size(); i++) {
                    BriefRubricItem r = rubric.get(i);
                    sb.append(r.getCriterion()).append(" (").append(r.getWeight()).append("%)");
                    if (i < rubric.size() - 1) sb.append(", ");
                }
                sb.append("\n");
            }
            sb.append("\n");

            // Brief raw text (first 12,000 characters)
            if (brief.getRawText() != null && !brief.getRawText().isBlank()) {
                String rawText = brief.getRawText();
                if (rawText.length() > 12000) {
                    rawText = rawText.substring(0, 12000);
                }
                sb.append("=== Brief Raw Text (first 12,000 chars) ===\n")
                        .append(rawText.trim())
                        .append("\n\n");
            }
        }

        sb.append("Reply ONLY in the exact format requested below, with no surrounding conversation or markdown blocks.\n\n");
        return sb.toString();
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
    Client[Web Frontend] -->|REST API| Server[Spring Boot Backend]
    Server -->|JDBC| DB[(PostgreSQL Database)]
```
""";
    }

    public String getExpectedFormatPhases() {
        return """
[
  {
    "id": "foundation",
    "name": "Phase 1: Foundation",
    "startPct": 0,
    "endPct": 25,
    "exitCheckpoint": "Repository initialized, CI passing, and data models created.",
    "goals": ["Set up project repository", "Configure database schema"]
  },
  {
    "id": "core",
    "name": "Phase 2: Core Build",
    "startPct": 25,
    "endPct": 65,
    "exitCheckpoint": "Main user flow functional end-to-end.",
    "goals": ["Implement core API endpoints", "Build primary user screens"]
  },
  {
    "id": "polish",
    "name": "Phase 3: Polish & Demo",
    "startPct": 65,
    "endPct": 100,
    "exitCheckpoint": "Demo script rehearsed and submission ready.",
    "goals": ["Run QA and edge case checks", "Record demo walkthrough"]
  }
]
""";
    }

    public String getExpectedFormatTasks() {
        return """
[
  {
    "title": "Set up database migrations and tables",
    "phaseId": "foundation",
    "role": "backend",
    "estimateMin": 120,
    "acceptance": ["Flyway migrations run cleanly", "Entities mapped"]
  },
  {
    "title": "Build core interactive dashboard",
    "phaseId": "core",
    "role": "frontend",
    "estimateMin": 180,
    "dependsOn": ["Set up database migrations and tables"],
    "acceptance": ["Displays real project data", "Responsive layout"]
  },
  {
    "title": "Record demo walkthrough video",
    "phaseId": "polish",
    "role": "domain",
    "estimateMin": 90,
    "acceptance": ["Video under 2 minutes", "Covers end-to-end workflow"]
  }
]
""";
    }

    public String getExpectedFormatDemo() {
        return """
# Demo script
- Hook (15s): Introduce the real-world friction and how our solution addresses it.
- Core flow (45s): Walk through the live user journey solving the problem.
- Wow moment (20s): Demonstrate the key differentiator and technical accomplishment.
- Impact & Next (10s): Summary of measurable outcomes and roadmap.

# Shot list
- Shot 1 (15s): Landing page and instant value proposition
- Shot 2 (45s): User navigating the primary workflow end-to-end
- Shot 3 (20s): Feature showcase and real-time computation
- Shot 4 (10s): Results review and next actions

# Likely judge Q&A
- Question: How does this scale beyond the demo data?
  Answer: The architecture uses stateless microservices with indexed PostgreSQL queries and CDN caching.
- Question: Who is the primary target user?
  Answer: Fast-paced teams who need instant coordination without context switching.
- Question: What breaks first under load?
  Answer: High concurrency sync calls; our fallback is background asynchronous queue processing.
""";
    }

    public String buildPromptForStep(
            String stepKey,
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<RoomMember> members,
            Map<UUID, User> users,
            Map<UUID, List<String>> memberSkillsMap,
            List<Idea> approvedIdeas,
            Map<UUID, String> authorNamesMap,
            Map<String, String> validatedAnswers
    ) {
        String header = buildCommonHeader(room, brief, rubric, members, users, memberSkillsMap, approvedIdeas, authorNamesMap);
        StringBuilder sb = new StringBuilder(header);

        switch (stepKey.toLowerCase()) {
            case "prd" -> sb.append(getExpectedFormatPrd());
            case "tech" -> {
                if (validatedAnswers != null && validatedAnswers.containsKey("prd")) {
                    sb.append("=== Validated PRD Answer ===\n").append(validatedAnswers.get("prd")).append("\n\n");
                }
                sb.append(getExpectedFormatTech());
            }
            case "phases" -> {
                if (validatedAnswers != null && validatedAnswers.containsKey("prd")) {
                    sb.append("=== Validated PRD Answer ===\n").append(validatedAnswers.get("prd")).append("\n\n");
                }
                if (validatedAnswers != null && validatedAnswers.containsKey("tech")) {
                    sb.append("=== Validated Tech Answer ===\n").append(validatedAnswers.get("tech")).append("\n\n");
                }
                sb.append(getExpectedFormatPhases());
            }
            case "tasks" -> {
                if (validatedAnswers != null && validatedAnswers.containsKey("phases")) {
                    sb.append("=== Validated Phases Answer ===\n").append(validatedAnswers.get("phases")).append("\n\n");
                }
                sb.append(getExpectedFormatTasks());
            }
            case "demo" -> {
                if (validatedAnswers != null && validatedAnswers.containsKey("prd")) {
                    sb.append("=== Validated PRD Answer ===\n").append(validatedAnswers.get("prd")).append("\n\n");
                }
                sb.append(getExpectedFormatDemo());
            }
            default -> sb.append(getExpectedFormatPrd());
        }

        return sb.toString();
    }
}
