package com.hackathonos.backend.pitch;

import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing pitch deck format, slides, rubric coverage, and slide linting.
 */
@Service
public class PitchDeckService {

    private final PitchDeckRepository deckRepository;
    private final PitchSlideRepository slideRepository;
    private final PitchSlideCoverageRepository coverageRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final RoomAccess roomAccess;
    private final AiService aiService;

    public PitchDeckService(
            PitchDeckRepository deckRepository,
            PitchSlideRepository slideRepository,
            PitchSlideCoverageRepository coverageRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            RoomAccess roomAccess,
            AiService aiService
    ) {
        this.deckRepository = deckRepository;
        this.slideRepository = slideRepository;
        this.coverageRepository = coverageRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.roomAccess = roomAccess;
        this.aiService = aiService;
    }

    /**
     * Gets pitch deck state, seeding default format and slides on first access.
     */
    @Transactional
    public PitchDtos.PitchDeckResponse getDeck(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        PitchDeck deck = deckRepository.findByRoomId(roomId).orElseGet(() -> {
            String judgingFormat = brief != null ? brief.getJudgingFormat() : "";
            String deliverables = brief != null ? brief.getDeliverables() : "";
            FormatProfileResolver.FormatProfile profile = FormatProfileResolver.resolve(judgingFormat, deliverables);
            PitchDeck newDeck = new PitchDeck(roomId, profile.kind(), Instant.now());
            return deckRepository.save(newDeck);
        });

        List<PitchSlide> slides = slideRepository.findByRoomIdOrderByPositionAsc(roomId);
        if (slides.isEmpty()) {
            slides = seedDefaultSlides(roomId, deck.getFormatKind());
        }

        List<UUID> slideIds = slides.stream().map(PitchSlide::getId).toList();
        List<PitchSlideCoverage> coverages = coverageRepository.findBySlideIdIn(slideIds);
        Map<UUID, List<String>> slideToCriteria = new HashMap<>();
        Map<String, List<String>> criterionToSlideIds = new HashMap<>();

        for (PitchSlideCoverage c : coverages) {
            slideToCriteria.computeIfAbsent(c.getSlideId(), k -> new ArrayList<>()).add(c.getCriterion());
            criterionToSlideIds.computeIfAbsent(c.getCriterion(), k -> new ArrayList<>()).add(c.getSlideId().toString());
        }

        List<BriefRubricItem> rubricItems = briefRepository.findByRoomId(roomId)
                .map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());
        List<String> allCriteria = rubricItems.stream().map(BriefRubricItem::getCriterion).toList();
        if (allCriteria.isEmpty()) {
            allCriteria = List.of("innovation", "feasibility", "impact", "technical_depth", "ux", "presentation");
        }

        // Coverage summary
        List<PitchDtos.CriterionCoverageDto> criterionDtos = new ArrayList<>();
        List<String> gaps = new ArrayList<>();
        for (String crit : allCriteria) {
            List<String> matchingSlides = criterionToSlideIds.getOrDefault(crit, Collections.emptyList());
            int weight = rubricItems.stream()
                    .filter(r -> r.getCriterion().equalsIgnoreCase(crit))
                    .map(BriefRubricItem::getWeight)
                    .findFirst()
                    .orElse(15);
            criterionDtos.add(new PitchDtos.CriterionCoverageDto(crit, weight, matchingSlides.size()));
            if (matchingSlides.isEmpty()) {
                gaps.add(crit);
            }
        }
        PitchDtos.DeckCoverageSummaryDto coverageSummary = new PitchDtos.DeckCoverageSummaryDto(criterionDtos, gaps);

        FormatProfileResolver.FormatProfile profile = FormatProfileResolver.getProfileForKind(deck.getFormatKind());
        PitchDtos.FormatProfileDto formatDto = new PitchDtos.FormatProfileDto(
                profile.kind(), profile.label(), profile.targetSeconds(), profile.maxSlides(), false
        );

        List<SlideLinter.LintIssue> lintIssues = SlideLinter.lint(slides, profile.maxSlides(), allCriteria, slideToCriteria);

        List<PitchDtos.SlideDto> slideDtos = slides.stream().map(s -> {
            List<String> covers = slideToCriteria.getOrDefault(s.getId(), Collections.emptyList());
            int wordCount = SlideLinter.countWords(s.getContent());
            return new PitchDtos.SlideDto(
                    s.getId(),
                    s.getPosition(),
                    s.getPosition() + 1,
                    s.getKind(),
                    s.getTitle(),
                    s.getQuestion(),
                    s.getQuestion(),
                    s.getContent(),
                    wordCount,
                    covers
            );
        }).toList();

        return new PitchDtos.PitchDeckResponse(
                formatDto,
                slideDtos,
                coverageSummary,
                criterionToSlideIds,
                lintIssues,
                Instant.now()
        );
    }

    /**
     * Updates pitch deck format kind; leader only.
     */
    @Transactional
    public PitchDtos.PitchDeckResponse updateFormat(UUID roomId, User user, PitchDtos.UpdateFormatRequest req) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        if (!"leader".equalsIgnoreCase(member.getRole())) {
            throw new BadRequestException("LEADER_ONLY", "Only the room leader can change the pitch format");
        }
        PitchDeck deck = deckRepository.findByRoomId(roomId)
                .orElseGet(() -> new PitchDeck(roomId, req.kind(), Instant.now()));
        deck.setFormatKind(req.kind());
        deck.setUpdatedAt(Instant.now());
        deckRepository.save(deck);
        return getDeck(roomId, user);
    }

    /**
     * Creates a new slide in the deck.
     */
    @Transactional
    public PitchDtos.SlideDto createSlide(UUID roomId, User user, PitchDtos.CreateSlideRequest req) {
        roomAccess.requireMember(roomId, user);
        List<PitchSlide> slides = slideRepository.findByRoomIdOrderByPositionAsc(roomId);
        int pos = slides.size();

        PitchSlide slide = new PitchSlide(
                roomId,
                pos,
                req.kind() != null ? req.kind() : "CUSTOM",
                req.title() != null ? req.title().trim() : "Custom Slide",
                req.question() != null ? req.question().trim() : "",
                req.content() != null ? req.content().trim() : ""
        );
        PitchSlide saved = slideRepository.save(slide);
        return new PitchDtos.SlideDto(
                saved.getId(), saved.getPosition(), saved.getPosition() + 1, saved.getKind(),
                saved.getTitle(), saved.getQuestion(), saved.getQuestion(), saved.getContent(),
                SlideLinter.countWords(saved.getContent()), Collections.emptyList()
        );
    }

    /**
     * Updates an existing slide.
     */
    @Transactional
    public PitchDtos.SlideDto updateSlide(UUID roomId, UUID slideId, User user, PitchDtos.UpdateSlideRequest req) {
        roomAccess.requireMember(roomId, user);
        PitchSlide slide = slideRepository.findById(slideId)
                .filter(s -> s.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("SLIDE_NOT_FOUND", "Slide not found"));

        if (req.kind() != null) slide.setKind(req.kind());
        if (req.title() != null) slide.setTitle(req.title().trim());
        if (req.question() != null) slide.setQuestion(req.question().trim());
        if (req.content() != null) slide.setContent(req.content().trim());

        PitchSlide saved = slideRepository.save(slide);
        List<String> covers = coverageRepository.findBySlideId(saved.getId()).stream()
                .map(PitchSlideCoverage::getCriterion).toList();

        return new PitchDtos.SlideDto(
                saved.getId(), saved.getPosition(), saved.getPosition() + 1, saved.getKind(),
                saved.getTitle(), saved.getQuestion(), saved.getQuestion(), saved.getContent(),
                SlideLinter.countWords(saved.getContent()), covers
        );
    }

    /**
     * Deletes a slide from the deck.
     */
    @Transactional
    public void deleteSlide(UUID roomId, UUID slideId, User user) {
        roomAccess.requireMember(roomId, user);
        PitchSlide slide = slideRepository.findById(slideId)
                .filter(s -> s.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("SLIDE_NOT_FOUND", "Slide not found"));

        coverageRepository.deleteBySlideId(slide.getId());
        slideRepository.delete(slide);

        // Re-index remaining slides
        List<PitchSlide> remaining = slideRepository.findByRoomIdOrderByPositionAsc(roomId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setPosition(i);
        }
        slideRepository.saveAll(remaining);
    }

    /**
     * Reorders slides according to the provided ID list.
     */
    @Transactional
    public void reorderSlides(UUID roomId, User user, PitchDtos.ReorderSlidesRequest req) {
        roomAccess.requireMember(roomId, user);
        List<PitchSlide> slides = slideRepository.findByRoomIdOrderByPositionAsc(roomId);
        Map<UUID, PitchSlide> byId = slides.stream().collect(Collectors.toMap(PitchSlide::getId, s -> s));

        int pos = 0;
        for (UUID id : req.slideIds()) {
            PitchSlide s = byId.get(id);
            if (s != null) {
                s.setPosition(pos++);
            }
        }
        slideRepository.saveAll(slides);
    }

    /**
     * Updates rubric criteria covered by a slide.
     */
    @Transactional
    public void updateCoverage(UUID roomId, UUID slideId, User user, PitchDtos.UpdateCoverageRequest req) {
        roomAccess.requireMember(roomId, user);
        PitchSlide slide = slideRepository.findById(slideId)
                .filter(s -> s.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("SLIDE_NOT_FOUND", "Slide not found"));

        coverageRepository.deleteBySlideId(slide.getId());
        if (req.criteria() != null) {
            for (String crit : req.criteria()) {
                if (crit != null && !crit.isBlank()) {
                    coverageRepository.save(new PitchSlideCoverage(slide.getId(), crit.trim()));
                }
            }
        }
    }

    /**
     * Exports the pitch deck outline as Markdown.
     */
    @Transactional(readOnly = true)
    public String exportMarkdown(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<PitchSlide> slides = slideRepository.findByRoomIdOrderByPositionAsc(roomId);
        StringBuilder sb = new StringBuilder();
        sb.append("# Pitch Deck Outline\n\n");
        for (PitchSlide s : slides) {
            sb.append("## ").append(s.getPosition() + 1).append(". ").append(s.getTitle()).append("\n");
            sb.append("**Guide question:** ").append(s.getQuestion()).append("\n\n");
            sb.append(s.getContent().isBlank() ? "*(No content drafted)*" : s.getContent()).append("\n\n");
        }
        return sb.toString();
    }

    /**
     * Uses AI to propose draft content for a slide based on PRD and the slide's guide question.
     */
    @Transactional(readOnly = true)
    public PitchDtos.DraftSlideResponse draftSlide(UUID roomId, UUID slideId, User user) {
        roomAccess.requireMember(roomId, user);
        PitchSlide slide = slideRepository.findById(slideId)
                .filter(s -> s.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("SLIDE_NOT_FOUND", "Slide not found"));

        String prdContent = getPrdContent(roomId);
        String prompt = "You are helping a hackathon team draft slide content for their pitch deck.\n" +
                "PRD and project background:\n" + prdContent + "\n\n" +
                "Slide Title: " + slide.getTitle() + "\n" +
                "Guide Question: " + slide.getQuestion() + "\n\n" +
                "Please draft concise, punchy slide content under 50 words that answers this question clearly and concretely.";

        String drafted = aiService.complete(user.getId(), prompt);
        if (drafted == null || drafted.isBlank()) {
            throw new BadRequestException("AI_DRAFT_FAILED", "Could not generate slide draft from AI");
        }
        return new PitchDtos.DraftSlideResponse(drafted.trim());
    }

    private List<PitchSlide> seedDefaultSlides(UUID roomId, String formatKind) {
        String problemText = "";
        String identityText = "";

        String prdContent = getPrdContent(roomId);
        if (!prdContent.isBlank()) {
            problemText = extractSection(prdContent, "Problem");
            identityText = extractSection(prdContent, "One-sentence identity");
        }

        List<PitchSlide> list = new ArrayList<>();
        list.add(new PitchSlide(roomId, 0, "PROBLEM", "Problem", "Who suffers and how often?",
                !problemText.isBlank() ? problemText : "Who suffers from this problem, and how severe is the friction?"));
        list.add(new PitchSlide(roomId, 1, "SOLUTION", "Solution", "What does it do, in one sentence?",
                !identityText.isBlank() ? identityText : "What does the product do, in one clear sentence?"));
        list.add(new PitchSlide(roomId, 2, "DEMO", "Demo", "What will the judge see?",
                "Live demonstration of the core workflow solving the problem."));
        list.add(new PitchSlide(roomId, 3, "IMPACT", "Impact", "What number changes?", ""));
        list.add(new PitchSlide(roomId, 4, "NEXT", "What's next", "What happens after this weekend?", ""));

        if ("ppt_first".equalsIgnoreCase(formatKind)) {
            list.add(new PitchSlide(roomId, 5, "TECH", "Tech stack", "How is it built?", ""));
            list.add(new PitchSlide(roomId, 6, "TEAM", "Team", "Who is building this?", ""));
        }

        return slideRepository.saveAll(list);
    }

    private String getPrdContent(UUID roomId) {
        return docRepository.findByRoomIdAndFileName(roomId, "PRD.md")
                .flatMap(d -> docVersionRepository.findByDocIdAndVersion(d.getId(), d.getCurrentVersion()))
                .map(DocVersion::getContent)
                .orElse("");
    }

    private String extractSection(String content, String heading) {
        int idx = content.indexOf(heading);
        if (idx < 0) return "";
        int start = idx + heading.length();
        int end = content.indexOf("\n#", start);
        String sub = end >= 0 ? content.substring(start, end) : content.substring(start);
        return sub.replaceAll("^[\\s:#-]+", "").trim();
    }
}
