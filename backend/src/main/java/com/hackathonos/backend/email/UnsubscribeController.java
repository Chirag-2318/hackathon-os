package com.hackathonos.backend.email;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@RestController
public class UnsubscribeController {

    private final UnsubscribeTokenService tokenService;
    private final UserRepository userRepository;
    private final UserEmailPreferenceRepository preferenceRepository;
    private final AppProperties appProperties;

    public UnsubscribeController(UnsubscribeTokenService tokenService,
                                 UserRepository userRepository,
                                 UserEmailPreferenceRepository preferenceRepository,
                                 AppProperties appProperties) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.appProperties = appProperties;
    }

    @GetMapping(value = "/api/v1/email/unsubscribe", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> unsubscribe(@RequestParam(required = false) String token) {
        Optional<UUID> userIdOpt = tokenService.verifyToken(token);
        String appUrl = appProperties.getPublicUrl();

        if (userIdOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(renderHtml(
                    "Invalid Unsubscribe Link",
                    "This unsubscribe link is invalid or has expired.",
                    appUrl
            ));
        }

        UUID userId = userIdOpt.get();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(renderHtml(
                    "Account Not Found",
                    "We could not locate the user account associated with this token.",
                    appUrl
            ));
        }

        User user = userOpt.get();
        user.setEmailReminders(false);
        userRepository.save(user);

        preferenceRepository.findByUserIdAndCategory(userId, EmailPreferenceService.CLOCK_REMINDERS)
                .ifPresentOrElse(
                        p -> {
                            p.setEnabled(false);
                            p.setUpdatedAt(java.time.Instant.now());
                            preferenceRepository.save(p);
                        },
                        () -> preferenceRepository.save(new UserEmailPreference(userId, EmailPreferenceService.CLOCK_REMINDERS, false, java.time.Instant.now()))
                );

        return ResponseEntity.ok(renderHtml(
                "Reminders Paused",
                "You have been unsubscribed from clock countdown reminder emails. You will still receive direct team invites, transactional notices, and security alerts.",
                appUrl
        ));
    }

    private String renderHtml(String title, String message, String appUrl) {
        return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + title + "</title>"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<style>"
                + "body { margin:0; padding:0; background:#0B0B0C; color:#2C2A26; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; box-sizing:border-box; }"
                + ".card { background:#F6F3EC; border-radius:16px; padding:40px 32px; max-width:440px; width:100%; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); }"
                + ".brand { font-family:Georgia, serif; font-size:18px; color:#8E8980; margin-bottom:16px; font-weight:700; }"
                + "h1 { font-family:Georgia, serif; font-size:22px; color:#0B0B0C; margin:0 0 12px 0; }"
                + "p { font-size:14px; line-height:22px; color:#4A4740; margin:0 0 28px 0; }"
                + ".btn { display:inline-block; padding:12px 24px; background:#0B0B0C; color:#F6F3EC; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600; }"
                + "</style></head><body>"
                + "<div class=\"card\">"
                + "<div class=\"brand\">[brackit]</div>"
                + "<h1>" + title + "</h1>"
                + "<p>" + message + "</p>"
                + "<a href=\"" + appUrl + "\" class=\"btn\">Return to [brackit]</a>"
                + "</div></body></html>";
    }
}
