package com.hackathonos.backend.email;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.common.security.RateLimited;
import com.hackathonos.backend.users.User;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mail")
public class MailTestController {

    private final CurrentUser currentUser;
    private final MailProperties mailProperties;
    private final MailTemplateRenderer templateRenderer;
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;
    private final Environment environment;

    public MailTestController(CurrentUser currentUser,
                              MailProperties mailProperties,
                              MailTemplateRenderer templateRenderer,
                              JavaMailSender mailSender,
                              AppProperties appProperties,
                              Environment environment) {
        this.currentUser = currentUser;
        this.mailProperties = mailProperties;
        this.templateRenderer = templateRenderer;
        this.mailSender = mailSender;
        this.appProperties = appProperties;
        this.environment = environment;
    }

    @PostMapping("/test-self")
    @RateLimited(key = "mail_test_self", limit = 3, periodSeconds = 3600)
    public ResponseEntity<Map<String, Object>> testSelf() {
        boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev");
        if (!isDev && !mailProperties.isTestEndpointEnabled()) {
            throw new ForbiddenException("FORBIDDEN", "Mail test endpoint is disabled. Set app.mail.test-endpoint-enabled=true or activate the dev profile.");
        }

        User user = currentUser.get();
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new BadRequestException("NO_EMAIL", "Your signed-in account does not have an email address configured.");
        }

        Map<String, Object> welcomeVars = Map.of(
                "handle", user.getUsername() != null ? user.getUsername() : "hacker",
                "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getName(),
                "level", user.getExperienceLevel() != null ? user.getExperienceLevel() : "Rookie",
                "roleTags", List.of("Full Stack"),
                "appUrl", appProperties.getPublicUrl()
        );

        try {
            MailTemplateRenderer.RenderedEmail rendered = templateRenderer.render("welcome", welcomeVars);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailProperties.getFromAddress(), mailProperties.getFromName());
            helper.setTo(user.getEmail());
            helper.setSubject("[TEST] " + rendered.subject());
            helper.setText(rendered.textBody(), rendered.htmlBody());
            if (mailProperties.getReplyTo() != null && !mailProperties.getReplyTo().isBlank()) {
                helper.setReplyTo(mailProperties.getReplyTo());
            }

            mailSender.send(message);

            return ResponseEntity.ok(Map.of(
                    "status", "SENT",
                    "recipient", user.getEmail(),
                    "message", "Mail sent successfully to " + user.getEmail()
            ));
        } catch (Exception e) {
            String rawMessage = e.getMessage() != null ? e.getMessage() : "";
            String hint = MailWorker.getHumanHint(rawMessage);
            if (hint.isEmpty()) {
                hint = "Check port 587 and mail credentials";
            }

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "status", "FAILED",
                    "error", rawMessage,
                    "hint", hint
            ));
        }
    }
}
