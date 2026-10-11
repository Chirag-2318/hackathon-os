package com.hackathonos.backend.portfolio;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.demo.DemoMedia;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.github.GithubRepo;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.retro.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Service managing user project showcase portfolio, public profiles, and recurring lessons learned.
 */
@Service
public class PortfolioService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9-]{3,30}$");
    private static final Set<String> RESERVED_SLUGS = Set.of(
            "admin", "api", "app", "login", "auth", "null", "public", "root", "system", "dashboard"
    );

    private final PortfolioSettingsRepository settingsRepository;
    private final PortfolioVisibilityRepository visibilityRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final RoomRepository roomRepository;
    private final RetroRepository retroRepository;
    private final RetroItemRepository retroItemRepository;
    private final RetroAwardRepository awardRepository;
    private final GithubRepoRepository githubRepoRepository;
    private final DemoMediaRepository demoMediaRepository;
    private final UserRepository userRepository;

    public PortfolioService(
            PortfolioSettingsRepository settingsRepository,
            PortfolioVisibilityRepository visibilityRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            RoomRepository roomRepository,
            RetroRepository retroRepository,
            RetroItemRepository retroItemRepository,
            RetroAwardRepository awardRepository,
            GithubRepoRepository githubRepoRepository,
            DemoMediaRepository demoMediaRepository,
            UserRepository userRepository
    ) {
        this.settingsRepository = settingsRepository;
        this.visibilityRepository = visibilityRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.roomRepository = roomRepository;
        this.retroRepository = retroRepository;
        this.retroItemRepository = retroItemRepository;
        this.awardRepository = awardRepository;
        this.githubRepoRepository = githubRepoRepository;
        this.demoMediaRepository = demoMediaRepository;
        this.userRepository = userRepository;
    }

    /**
     * Gets user portfolio dashboard, personal project entries, and recurring mistakes summary.
     */
    @Transactional(readOnly = true)
    public PortfolioDtos.PortfolioDashboardResponse getMyPortfolio(User user) {
        UUID userId = user.getId();
        PortfolioSettings settings = settingsRepository.findByUserId(userId)
                .orElseGet(() -> new PortfolioSettings(userId, null, false));

        List<RoomMember> memberships = memberRepository.findByUserId(userId);
        List<PortfolioDtos.PortfolioItemDto> items = new ArrayList<>();
        Map<String, Long> tagCounts = new HashMap<>();

        Instant now = Instant.now();

        for (RoomMember m : memberships) {
            Room room = roomRepository.findById(m.getRoomId()).orElse(null);
            if (room == null) continue;

            Optional<Retro> retroOpt = retroRepository.findByRoomId(room.getId());
            boolean eventEnded = room.getEventEnd() != null && now.isAfter(room.getEventEnd());

            if (!eventEnded && retroOpt.isEmpty()) {
                continue; // Only rooms where event ended or retro exists
            }

            // Count "didn't go well" tags across rooms
            List<RetroItem> didntGoItems = retroItemRepository.findByRoomIdAndKindOrderByCreatedAtAsc(room.getId(), "DIDNT_GO");
            for (RetroItem item : didntGoItems) {
                if (item.getTag() != null && !item.getTag().isBlank()) {
                    tagCounts.put(item.getTag(), tagCounts.getOrDefault(item.getTag(), 0L) + 1);
                }
            }

            boolean visible = visibilityRepository.findByUserIdAndRoomId(userId, room.getId())
                    .map(PortfolioVisibility::isVisible)
                    .orElse(true);

            List<String> mySkills = skillRepository.findByMemberId(m.getId()).stream()
                    .map(RoomMemberSkill::getSkill).toList();

            Optional<GithubRepo> repo = githubRepoRepository.findById(room.getId());
            Optional<DemoMedia> media = demoMediaRepository.findByRoomId(room.getId());
            RetroDtos.ProjectLinksDto links = new RetroDtos.ProjectLinksDto(
                    repo.map(GithubRepo::getUrl).orElse(null),
                    media.map(DemoMedia::getVideoUrl).orElse(null),
                    repo.map(GithubRepo::getDeployedLink).orElse(null)
            );

            List<RetroDtos.AwardDto> awards = awardRepository.findByRoomIdOrderByNameAsc(room.getId()).stream()
                    .map(a -> new RetroDtos.AwardDto(a.getId(), a.getName(), a.getDetail())).toList();

            items.add(new PortfolioDtos.PortfolioItemDto(
                    room.getId(),
                    room.getName(),
                    "Standard Track",
                    room.getEventStart() != null ? room.getEventStart() : room.getCreatedAt(),
                    room.getEventEnd(),
                    m.getRole(),
                    mySkills,
                    retroOpt.map(Retro::getPortfolioSummary).orElse(""),
                    links,
                    retroOpt.map(Retro::getResult).orElse(null),
                    awards,
                    retroOpt.map(Retro::getDecision).orElse(null),
                    retroOpt.isPresent(),
                    visible
            ));
        }

        List<PortfolioDtos.LessonSummaryDto> lessons = tagCounts.entrySet().stream()
                .map(e -> new PortfolioDtos.LessonSummaryDto(e.getKey(), e.getValue()))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .toList();

        return new PortfolioDtos.PortfolioDashboardResponse(
                new PortfolioDtos.PortfolioSettingsDto(settings.isPublic(), settings.getSlug()),
                items,
                lessons
        );
    }

    /**
     * Updates portfolio public toggle and custom profile URL slug.
     */
    @Transactional
    public PortfolioDtos.PortfolioSettingsDto updateSettings(User user, PortfolioDtos.UpdateSettingsRequest req) {
        UUID userId = user.getId();
        PortfolioSettings settings = settingsRepository.findByUserId(userId)
                .orElseGet(() -> new PortfolioSettings(userId, null, false));

        if (req.slug() != null) {
            String slug = req.slug().trim().toLowerCase(Locale.ROOT);
            if (!slug.isBlank()) {
                if (!SLUG_PATTERN.matcher(slug).matches()) {
                    throw new BadRequestException("INVALID_SLUG", "Slug must be 3-30 lowercase characters with numbers or dashes");
                }
                if (RESERVED_SLUGS.contains(slug)) {
                    throw new BadRequestException("RESERVED_SLUG", "Slug '" + slug + "' is reserved and cannot be used");
                }
                Optional<PortfolioSettings> existing = settingsRepository.findBySlug(slug);
                if (existing.isPresent() && !existing.get().getUserId().equals(userId)) {
                    throw new ConflictException("SLUG_TAKEN", "Portfolio slug is already taken");
                }
                settings.setSlug(slug);
            } else {
                settings.setSlug(null);
            }
        }

        if (req.isPublic() != null) {
            settings.setPublic(req.isPublic());
        }

        PortfolioSettings saved = settingsRepository.save(settings);
        return new PortfolioDtos.PortfolioSettingsDto(saved.isPublic(), saved.getSlug());
    }

    /**
     * Toggles whether a project room appears in public showcase.
     */
    @Transactional
    public void setVisibility(UUID roomId, User user, PortfolioDtos.SetVisibilityRequest req) {
        UUID userId = user.getId();
        PortfolioVisibility vis = visibilityRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseGet(() -> new PortfolioVisibility(userId, roomId, true));

        vis.setVisible(req.visible() != null ? req.visible() : true);
        visibilityRepository.save(vis);
    }

    /**
     * Public portfolio showcase endpoint exposing only visible projects without internal IDs or emails.
     */
    @Transactional(readOnly = true)
    public PortfolioDtos.PublicPortfolioResponse getPublicPortfolioBySlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new NotFoundException("PORTFOLIO_NOT_FOUND", "Portfolio not found");
        }

        PortfolioSettings settings = settingsRepository.findBySlug(slug.trim().toLowerCase(Locale.ROOT))
                .filter(PortfolioSettings::isPublic)
                .orElseThrow(() -> new NotFoundException("PORTFOLIO_NOT_FOUND", "Public portfolio not found"));

        User owner = userRepository.findById(settings.getUserId())
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));

        List<RoomMember> memberships = memberRepository.findByUserId(owner.getId());
        List<PortfolioDtos.PublicItemDto> publicItems = new ArrayList<>();

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM yyyy").withZone(ZoneOffset.UTC);

        for (RoomMember m : memberships) {
            boolean visible = visibilityRepository.findByUserIdAndRoomId(owner.getId(), m.getRoomId())
                    .map(PortfolioVisibility::isVisible)
                    .orElse(true);

            if (!visible) continue;

            Room room = roomRepository.findById(m.getRoomId()).orElse(null);
            if (room == null) continue;

            Optional<Retro> retroOpt = retroRepository.findByRoomId(room.getId());
            Optional<GithubRepo> repo = githubRepoRepository.findById(room.getId());
            Optional<DemoMedia> media = demoMediaRepository.findByRoomId(room.getId());

            RetroDtos.ProjectLinksDto links = new RetroDtos.ProjectLinksDto(
                    repo.map(GithubRepo::getUrl).orElse(null),
                    media.map(DemoMedia::getVideoUrl).orElse(null),
                    repo.map(GithubRepo::getDeployedLink).orElse(null)
            );

            List<RetroDtos.AwardDto> awards = awardRepository.findByRoomIdOrderByNameAsc(room.getId()).stream()
                    .map(a -> new RetroDtos.AwardDto(a.getId(), a.getName(), a.getDetail())).toList();

            String dates = room.getEventStart() != null ? dtf.format(room.getEventStart()) : "2026";
            publicItems.add(new PortfolioDtos.PublicItemDto(
                    room.getName(),
                    dates,
                    retroOpt.map(Retro::getPortfolioSummary).orElse(""),
                    links,
                    retroOpt.map(Retro::getResult).orElse(null),
                    awards
            ));
        }

        return new PortfolioDtos.PublicPortfolioResponse(
                owner.getName(),
                owner.getAvatarUrl(),
                publicItems
        );
    }
}
