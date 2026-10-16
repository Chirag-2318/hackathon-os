package com.hackathonos.backend.billing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ErrorCode;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.InputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    private static final ZoneId KOLKATA_ZONE = ZoneId.of("Asia/Kolkata");

    private final UserPlanRepository userPlanRepository;
    private final PlanInterestRepository planInterestRepository;
    private final RoomRepository roomRepository;
    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;

    @Value("${BILLING_ENFORCE:${billing.enforce:false}}")
    private boolean billingEnforce;

    @Value("${BILLING_DEFAULT_PLAN:${billing.default-plan:FREE}}")
    private String defaultPlan;

    private PlansConfigFile plansConfig;

    private final Map<UUID, List<Long>> interestRateLimits = new ConcurrentHashMap<>();

    public record PlanFeatureDto(String text, boolean planned) {}

    public record PlanDefinitionDto(
            String id,
            String name,
            int price,
            Integer roomsPerMonth,
            String description,
            List<PlanFeatureDto> features
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PlansConfigFile(
            boolean paymentsEnabled,
            String currency,
            List<PlanDefinitionDto> plans
    ) {}

    public record UsageDto(
            long roomsThisMonth,
            Integer limit,
            String resetsAt
    ) {}

    public record BillingSummaryResponse(
            String plan,
            UsageDto usage,
            List<PlanDefinitionDto> plans,
            boolean enforce,
            boolean paymentsEnabled,
            String currency,
            Set<String> waitlistedPlans
    ) {}

    public BillingService(UserPlanRepository userPlanRepository,
                          PlanInterestRepository planInterestRepository,
                          RoomRepository roomRepository,
                          ObjectMapper objectMapper,
                          ResourceLoader resourceLoader) {
        this.userPlanRepository = userPlanRepository;
        this.planInterestRepository = planInterestRepository;
        this.roomRepository = roomRepository;
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() {
        loadPlansConfig();
    }

    public synchronized void loadPlansConfig() {
        try {
            // Check file system first (config/plans.json)
            File file = new File("config/plans.json");
            if (file.exists()) {
                plansConfig = objectMapper.readValue(file, PlansConfigFile.class);
            } else {
                // Classpath fallback
                Resource res = resourceLoader.getResource("classpath:config/plans.json");
                if (res.exists()) {
                    try (InputStream is = res.getInputStream()) {
                        plansConfig = objectMapper.readValue(is, PlansConfigFile.class);
                    }
                }
            }

            if (plansConfig == null || plansConfig.plans() == null || plansConfig.plans().isEmpty()) {
                throw new IllegalStateException("plans.json is missing or contains no plans");
            }

            // Validate that FREE, PRO, and MAX plans are defined
            boolean hasFree = plansConfig.plans().stream().anyMatch(p -> "FREE".equalsIgnoreCase(p.id()));
            boolean hasPro = plansConfig.plans().stream().anyMatch(p -> "PRO".equalsIgnoreCase(p.id()));
            boolean hasMax = plansConfig.plans().stream().anyMatch(p -> "MAX".equalsIgnoreCase(p.id()));
            if (!hasFree || !hasPro || !hasMax) {
                log.warn("plans.json does not define all standard plans (FREE, PRO, MAX)");
            }
            log.info("Loaded {} plans from config. Payments enabled: {}", plansConfig.plans().size(), plansConfig.paymentsEnabled());
        } catch (Exception e) {
            log.error("Failed to load plans.json", e);
            // Safe fallback configuration
            plansConfig = new PlansConfigFile(
                    false,
                    "USD",
                    List.of(
                            new PlanDefinitionDto("FREE", "Free", 0, 3, "Essential toolkit", List.of(new PlanFeatureDto("3 rooms per month", false))),
                            new PlanDefinitionDto("PRO", "Pro", 9, 25, "For prolific hackers", List.of(new PlanFeatureDto("25 rooms per month", false))),
                            new PlanDefinitionDto("MAX", "Max", 19, null, "Full access", List.of(new PlanFeatureDto("Unlimited rooms", false)))
                    )
            );
        }
    }

    public String getUserPlan(User user) {
        if (user == null) return defaultPlan;
        return userPlanRepository.findById(user.getId())
                .map(UserPlan::getPlan)
                .orElse(defaultPlan != null ? defaultPlan : "FREE");
    }

    public long getRoomsCreatedThisMonth(User user) {
        if (user == null) return 0;
        ZonedDateTime nowKolkata = ZonedDateTime.now(KOLKATA_ZONE);
        ZonedDateTime startOfMonth = nowKolkata.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        return roomRepository.countByOwnerIdAndCreatedAtGreaterThanEqual(user.getId(), startOfMonth.toInstant());
    }

    public String getResetsAtLabel() {
        ZonedDateTime nowKolkata = ZonedDateTime.now(KOLKATA_ZONE);
        ZonedDateTime startOfNextMonth = nowKolkata.withDayOfMonth(1).plusMonths(1).truncatedTo(ChronoUnit.DAYS);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);
        return "Resets " + startOfNextMonth.format(fmt);
    }

    public Integer getPlanLimit(String plan) {
        if (plansConfig != null && plansConfig.plans() != null) {
            for (PlanDefinitionDto p : plansConfig.plans()) {
                if (p.id().equalsIgnoreCase(plan)) {
                    return p.roomsPerMonth();
                }
            }
        }
        if ("PRO".equalsIgnoreCase(plan)) return 25;
        if ("MAX".equalsIgnoreCase(plan)) return null;
        return 3;
    }

    @Transactional(readOnly = true)
    public BillingSummaryResponse getBillingSummary(User user) {
        String plan = getUserPlan(user);
        long roomsThisMonth = getRoomsCreatedThisMonth(user);
        Integer limit = getPlanLimit(plan);
        String resetsAt = getResetsAtLabel();

        List<PlanInterest> interests = planInterestRepository.findByUserId(user.getId());
        Set<String> waitlisted = new HashSet<>();
        for (PlanInterest pi : interests) {
            waitlisted.add(pi.getPlan().toUpperCase());
        }

        return new BillingSummaryResponse(
                plan,
                new UsageDto(roomsThisMonth, limit, resetsAt),
                plansConfig != null ? plansConfig.plans() : Collections.emptyList(),
                billingEnforce,
                plansConfig != null && plansConfig.paymentsEnabled(),
                plansConfig != null && plansConfig.currency() != null ? plansConfig.currency() : "USD",
                waitlisted
        );
    }

    @Transactional
    public void recordInterest(User user, String plan, String note) {
        if (plan == null || (!plan.equalsIgnoreCase("PRO") && !plan.equalsIgnoreCase("MAX"))) {
            throw new BadRequestException("INVALID_PLAN", "Waitlist is available only for Pro and Max plans");
        }

        checkInterestRateLimit(user.getId());

        String targetPlan = plan.toUpperCase();
        Optional<PlanInterest> existing = planInterestRepository.findByUserIdAndPlan(user.getId(), targetPlan);
        if (existing.isPresent()) {
            PlanInterest pi = existing.get();
            if (note != null && !note.isBlank()) {
                pi.setNote(note.trim());
                planInterestRepository.save(pi);
            }
        } else {
            PlanInterest pi = new PlanInterest(user.getId(), targetPlan, note != null ? note.trim() : null);
            planInterestRepository.save(pi);
        }
    }

    private void checkInterestRateLimit(UUID userId) {
        long now = System.currentTimeMillis();
        long window = now - 3600_000L; // 1 hour
        List<Long> timestamps = interestRateLimits.compute(userId, (k, v) -> {
            if (v == null) v = new ArrayList<>();
            v.removeIf(t -> t < window);
            v.add(now);
            return v;
        });
        if (timestamps.size() > 10) {
            throw new TooManyRequestsException("Too many waitlist submissions. Please wait an hour.");
        }
    }

    public void checkCanCreateRoom(User creator) {
        if (!billingEnforce) return;

        String plan = getUserPlan(creator);
        Integer limit = getPlanLimit(plan);
        if (limit != null) {
            long count = getRoomsCreatedThisMonth(creator);
            if (count >= limit) {
                Map<String, String> errors = new HashMap<>();
                errors.put("upgradeRoute", "/app/settings/billing");
                errors.put("roomsThisMonth", String.valueOf(count));
                errors.put("limit", String.valueOf(limit));
                throw new BadRequestException(
                        ErrorCode.PLAN_LIMIT_REACHED.getCode(),
                        "You have reached your limit of " + limit + " rooms this month. Upgrade to Pro for 25 rooms or Max for unlimited.",
                        errors
                );
            }
        }
    }

    public void checkCanAccessReviewPages(User user) {
        if (!billingEnforce) return;

        String plan = getUserPlan(user);
        if (!"MAX".equalsIgnoreCase(plan)) {
            throw new ForbiddenException(
                    ErrorCode.PLAN_REQUIRED.getCode(),
                    "Review, Retro and Summary pages require the Max plan."
            );
        }
    }
}
