package com.hackathonos.backend.email;

import jakarta.mail.internet.MimeMessage;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/dev/mail")
@Profile("dev")
public class DevMailController {

    private final MailTemplateRenderer templateRenderer;
    private final MailProperties mailProperties;
    private final org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSenderProvider;
    private final com.hackathonos.backend.common.config.AppProperties appProperties;

    public DevMailController(MailTemplateRenderer templateRenderer,
                             MailProperties mailProperties,
                             org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSenderProvider,
                             com.hackathonos.backend.common.config.AppProperties appProperties) {
        this.templateRenderer = templateRenderer;
        this.mailProperties = mailProperties;
        this.mailSenderProvider = mailSenderProvider;
        this.appProperties = appProperties;
    }

    @GetMapping(value = "/preview/{template}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> preview(@PathVariable String template,
                                          @RequestParam(required = false) String variant) {
        Map<String, Object> sampleVars = buildSampleVars(template, variant);
        MailTemplateRenderer.RenderedEmail rendered = templateRenderer.render(template, sampleVars);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(rendered.htmlBody());
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTest(
            @RequestParam(defaultValue = "welcome") String template,
            @RequestParam String to,
            @RequestParam(required = false) String variant
    ) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "error", "JavaMailSender is not configured or disabled"
            ));
        }

        try {
            Map<String, Object> sampleVars = buildSampleVars(template, variant);
            MailTemplateRenderer.RenderedEmail rendered = templateRenderer.render(template, sampleVars);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailProperties.getFromAddress(), mailProperties.getFromName());
            helper.setTo(to.trim());
            helper.setSubject("[TEST] " + rendered.subject());
            helper.setText(rendered.textBody(), rendered.htmlBody());
            if (mailProperties.getReplyTo() != null && !mailProperties.getReplyTo().isBlank()) {
                helper.setReplyTo(mailProperties.getReplyTo());
            }
            message.setHeader("Auto-Submitted", "auto-generated");

            mailSender.send(message);

            return ResponseEntity.ok(Map.of(
                    "status", "SENT",
                    "to", to,
                    "template", template,
                    "subject", rendered.subject()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "error", e.getMessage() != null ? e.getMessage() : "Failed to send test email"
            ));
        }
    }

    private Map<String, Object> buildSampleVars(String template, String variant) {
        Map<String, Object> vars = new HashMap<>();
        String base = appProperties.getPublicUrl();
        String t = template != null ? template.toLowerCase() : "";
        switch (t) {
            case "welcome" -> {
                vars.put("handle", "alex_river_very_long_handle_sample");
                vars.put("displayName", "Alexander Montgomery Riverstone III");
                vars.put("level", "Veteran");
                vars.put("roleTags", List.of("Frontend", "Design", "Machine Learning"));
                vars.put("appUrl", base);
            }
            case "invite" -> {
                vars.put("roomName", "Autonomous Multi-Agent Planetary Exploration Rover and Sub-Surface Drilling Architecture");
                vars.put("inviter", "sarah_commander");
                vars.put("templateName", "Full Stack AI Hackathon");
                vars.put("duration", "36h");
                vars.put("memberCount", 3);
                vars.put("memberCap", 4);
                vars.put("stubCode", "ROVER9");
                vars.put("note", "We have the hardware integration and real-time backend ready. We urgently need your vision and UI expertise to secure the prize!");
                vars.put("inviteUrl", base + "/join?token=sample_token_32_bytes_test_demo");
                vars.put("expiryDate", "Oct 24, 2026");
                vars.put("joinCode", "ROVER999");
            }
            case "joined" -> {
                vars.put("variant", variant != null && !variant.isBlank() ? variant : "SELF");
                vars.put("roomName", "Quantum Cryptography and Edge Ledger Systems");
                vars.put("roomId", UUID.randomUUID().toString());
                vars.put("appUrl", base);
                vars.put("handle", "neo_hacker");
                vars.put("displayName", "Thomas A. Anderson");
                vars.put("memberCount", 3);
                vars.put("memberCap", 4);
                vars.put("roleTags", List.of("Backend", "Security", "DevOps"));
                vars.put("nextStep", "Review the event brief and contribute initial ideas on the Ideate board.");

                List<Map<String, Object>> teammates = new ArrayList<>();
                teammates.add(Map.of("handle", "trinity", "displayName", "Trinity Lead", "role", "Lead / Full Stack", "isLeader", true, "avatarUrl", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"));
                teammates.add(Map.of("handle", "morpheus", "displayName", "Morpheus Captain", "role", "Architect", "isLeader", false, "avatarUrl", ""));
                teammates.add(Map.of("handle", "cypher", "displayName", "Reagan Cypher", "role", "Domain Expert", "isLeader", false, "avatarUrl", ""));
                vars.put("teammates", teammates);
            }
            case "reminder" -> {
                String k = variant != null && !variant.isBlank() ? variant.toUpperCase() : "FREEZE_3H";
                vars.put("kind", k);
                vars.put("roomName", "DeepSpace Telemetry and Zero-Knowledge Proofs");
                vars.put("countdown", "03:00:00");
                vars.put("asOfTime", "06:30 PM IST");
                vars.put("elapsedPercent", 75);
                vars.put("openTasksCount", 2);
                vars.put("confirmTasksCount", 1);
                vars.put("nextStep", "Lock PRD cut-list and submit the working prototype demonstration.");
                vars.put("boardUrl", base + "/room/dev-sample-id/board");
                vars.put("unsubscribeUrl", base + "/api/v1/email/unsubscribe?token=sample_test_token");
            }
            default -> {}
        }
        return vars;
    }
}
