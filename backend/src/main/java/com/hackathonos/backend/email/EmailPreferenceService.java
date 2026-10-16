package com.hackathonos.backend.email;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailPreferenceService {

    public static final String CLOCK_REMINDERS = "CLOCK_REMINDERS";
    public static final String TASK_ASSIGNED = "TASK_ASSIGNED";
    public static final String BLOCKERS = "BLOCKERS";
    public static final String REVIEW = "REVIEW";
    public static final String CHECKPOINTS = "CHECKPOINTS";
    public static final String TEAM_CHANGES = "TEAM_CHANGES";
    public static final String ANNOUNCEMENTS = "ANNOUNCEMENTS";
    public static final String ALERTS = "ALERTS";

    public static final List<String> ALL_CATEGORIES = List.of(
            CLOCK_REMINDERS,
            TASK_ASSIGNED,
            BLOCKERS,
            REVIEW,
            CHECKPOINTS,
            TEAM_CHANGES,
            ANNOUNCEMENTS,
            ALERTS
    );

    // Categories that actually have triggers in this codebase (ANNOUNCEMENTS has none)
    public static final Set<String> ACTIVE_TRIGGER_CATEGORIES = Set.of(
            CLOCK_REMINDERS,
            TASK_ASSIGNED,
            BLOCKERS,
            REVIEW,
            CHECKPOINTS,
            TEAM_CHANGES,
            ALERTS
    );

    private final UserEmailPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository memberRepository;
    private final MailService mailService;
    private final AppProperties appProperties;

    // Rate limiter for test email: 1 per 10 minutes per user
    private final Map<UUID, Instant> lastTestEmailTimes = new ConcurrentHashMap<>();

    public EmailPreferenceService(UserEmailPreferenceRepository preferenceRepository,
                                  UserRepository userRepository,
                                  RoomMemberRepository memberRepository,
                                  MailService mailService,
                                  AppProperties appProperties) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.mailService = mailService;
        this.appProperties = appProperties;
    }

    public record EmailPrefsResponse(
            boolean paused,
            Map<String, Boolean> categories,
            String maskedEmail,
            List<String> applicableCategories
    ) {}

    public record UpdateEmailPrefsRequest(
            Boolean paused,
            Map<String, Boolean> categories
    ) {}

    public record TestEmailResponse(
            boolean ok,
            String message,
            String error
    ) {}

    @Transactional(readOnly = true)
    public EmailPrefsResponse getPreferences(User user) {
        User freshUser = userRepository.findById(user.getId()).orElse(user);
        boolean paused = freshUser.isEmailPaused();
        String masked = maskEmail(freshUser.getEmail());

        List<UserEmailPreference> existingPrefs = preferenceRepository.findByUserId(user.getId());
        Map<String, Boolean> prefsMap = new LinkedHashMap<>();
        for (String cat : ALL_CATEGORIES) {
            prefsMap.put(cat, true); // default true
        }
        for (UserEmailPreference pref : existingPrefs) {
            prefsMap.put(pref.getCategory(), pref.isEnabled());
        }

        List<String> applicable = new ArrayList<>();
        boolean isLeaderInAnyRoom = memberRepository.findByUserId(user.getId()).stream()
                .anyMatch(m -> "LEADER".equalsIgnoreCase(m.getRole()));

        for (String cat : ALL_CATEGORIES) {
            // ANNOUNCEMENTS has no trigger in code, so not active
            if (!ACTIVE_TRIGGER_CATEGORIES.contains(cat)) {
                continue;
            }
            applicable.add(cat);
        }

        return new EmailPrefsResponse(paused, prefsMap, masked, applicable);
    }

    @Transactional
    public EmailPrefsResponse updatePreferences(User user, UpdateEmailPrefsRequest request) {
        User freshUser = userRepository.findById(user.getId()).orElseThrow();
        if (request.paused() != null) {
            freshUser.setEmailPaused(request.paused());
            userRepository.save(freshUser);
        }

        if (request.categories() != null) {
            Instant now = Instant.now();
            for (Map.Entry<String, Boolean> entry : request.categories().entrySet()) {
                String cat = entry.getKey().toUpperCase().trim();
                if (!ALL_CATEGORIES.contains(cat)) {
                    continue;
                }
                boolean enabled = Boolean.TRUE.equals(entry.getValue());
                UserEmailPreference pref = preferenceRepository.findByUserIdAndCategory(user.getId(), cat)
                        .orElse(new UserEmailPreference(user.getId(), cat, enabled, now));
                pref.setEnabled(enabled);
                pref.setUpdatedAt(now);
                preferenceRepository.save(pref);

                if (CLOCK_REMINDERS.equals(cat)) {
                    freshUser.setEmailReminders(enabled);
                    userRepository.save(freshUser);
                }
            }
        }

        return getPreferences(freshUser);
    }

    @Transactional
    public TestEmailResponse sendTestEmail(User user) {
        Instant now = Instant.now();
        Instant lastSent = lastTestEmailTimes.get(user.getId());
        if (lastSent != null && ChronoUnit.MINUTES.between(lastSent, now) < 10) {
            long remainingMinutes = 10 - ChronoUnit.MINUTES.between(lastSent, now);
            return new TestEmailResponse(false, null, "Please wait " + remainingMinutes + " minute(s) before sending another test email.");
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return new TestEmailResponse(false, null, "No email address found on your account.");
        }

        try {
            Map<String, Object> vars = new HashMap<>();
            vars.put("roomName", "Demo Sprint Room");
            vars.put("headline", "Sample team update");
            vars.put("subject", "Test update: Build the login flow");
            vars.put("roomUrl", appProperties.getFrontendUrl() + "/app");
            vars.put("notificationsSettingsUrl", appProperties.getFrontendUrl() + "/app/settings/notifications");

            List<Map<String, Object>> items = List.of(
                    Map.of(
                            "time", "Just now",
                            "category", "TASK",
                            "text", "You were assigned: Build the login flow and auth guard",
                            "link", appProperties.getFrontendUrl() + "/app"
                    ),
                    Map.of(
                            "time", "10m ago",
                            "category", "ALERT",
                            "text", "Demo freeze window confirmed for 18:00 IST",
                            "link", appProperties.getFrontendUrl() + "/app"
                    )
            );
            vars.put("items", items);

            mailService.enqueueDirect("update", user.getEmail(), vars, "test-update:" + user.getId() + ":" + now.toEpochMilli());
            lastTestEmailTimes.put(user.getId(), now);
            return new TestEmailResponse(true, "Test email queued for " + maskEmail(user.getEmail()), null);
        } catch (Exception e) {
            return new TestEmailResponse(false, null, "Failed to send test email: " + e.getMessage());
        }
    }

    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) return "—";
        String trimmed = email.trim();
        int atIndex = trimmed.indexOf('@');
        if (atIndex <= 0) return trimmed;
        String local = trimmed.substring(0, atIndex);
        String domain = trimmed.substring(atIndex); // includes @
        String firstChar = local.substring(0, 1);
        return firstChar + "***" + domain;
    }
}
