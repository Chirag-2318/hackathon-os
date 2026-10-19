package com.hackathonos.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
public class MailTemplateRenderer {

    private static final Logger log = LoggerFactory.getLogger(MailTemplateRenderer.class);
    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter IST_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a").withZone(IST_ZONE);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneId.of("UTC"));

    private final ResourceLoader resourceLoader;
    private final com.hackathonos.backend.common.config.AppProperties appProperties;

    public record RenderedEmail(String subject, String htmlBody, String textBody) {}

    public MailTemplateRenderer(ResourceLoader resourceLoader, com.hackathonos.backend.common.config.AppProperties appProperties) {
        this.resourceLoader = resourceLoader;
        this.appProperties = appProperties;
    }

    private String publicUrl() {
        return appProperties != null ? appProperties.getPublicUrl() : "";
    }

    public RenderedEmail render(String templateName, Map<String, Object> vars) {
        String template = templateName != null ? templateName.toLowerCase() : "";
        return switch (template) {
            case "welcome" -> renderWelcome(vars);
            case "invite" -> renderInvite(vars);
            case "joined" -> renderJoined(vars);
            case "reminder" -> renderReminder(vars);
            case "update" -> renderUpdate(vars);
            default -> throw new IllegalArgumentException("Unknown email template: " + templateName);
        };
    }

    public RenderedEmail renderWelcome(Map<String, Object> vars) {
        String handle = str(vars.get("handle"), "hacker");
        String displayName = str(vars.get("displayName"), handle);
        String level = str(vars.get("level"), "Rookie");
        String appUrl = str(vars.get("appUrl"), publicUrl());

        String roleTagsStr = formatRoleTags(vars.get("roleTags"));

        String subject = "Badge printed, @" + handle;
        String preheader = "Your [brackit] participant badge is ready.";

        String barcodeCells = renderBarcode(handle);

        String templateHtml = loadResource("classpath:mail/welcome.html");
        String contentHtml = templateHtml
                .replace("{{HANDLE}}", escapeHtml(handle))
                .replace("{{DISPLAY_NAME}}", escapeHtml(displayName))
                .replace("{{LEVEL}}", escapeHtml(level))
                .replace("{{ROLE_TAGS}}", roleTagsStr)
                .replace("{{BARCODE_CELLS}}", barcodeCells)
                .replace("{{APP_URL}}", escapeHtml(appUrl));

        String fullHtml = wrapLayout(subject, preheader, contentHtml, "");

        String templateTxt = loadResource("classpath:mail/welcome.txt");
        String fullTxt = templateTxt
                .replace("{{HANDLE}}", handle)
                .replace("{{DISPLAY_NAME}}", displayName)
                .replace("{{LEVEL}}", level)
                .replace("{{ROLE_TAGS}}", unescapeTags(roleTagsStr))
                .replace("{{APP_URL}}", appUrl);

        return new RenderedEmail(subject, fullHtml, fullTxt);
    }

    public RenderedEmail renderInvite(Map<String, Object> vars) {
        String roomName = str(vars.get("roomName"), "Hackathon Room");
        String inviter = str(vars.get("inviter"), "team_lead");
        String templateName = str(vars.get("templateName"), "Full Stack Hackathon");
        String duration = str(vars.get("duration"), "36h");
        int count = intVal(vars.get("memberCount"), 1);
        int cap = intVal(vars.get("memberCap"), 4);
        String seatsFilled = count + " of " + cap + " seats filled";
        String stubCode = str(vars.get("stubCode"), "JOIN");
        String inviteUrl = str(vars.get("inviteUrl"), publicUrl() + "/join");
        String expiryDate = str(vars.get("expiryDate"), "in 7 days");
        String note = str(vars.get("note"), null);
        String joinCode = str(vars.get("joinCode"), null);

        String subject = "@" + inviter + " saved you a seat on " + roomName;
        String preheader = "You were invited to join " + roomName + " on [brackit].";

        String noteHtml = "";
        String noteTxt = "";
        if (note != null && !note.isBlank()) {
            noteHtml = "<div style=\"background-color:#FBF9F5;border-left:3px solid #E8A33D;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;font-style:italic;color:#4A4740;font-size:14px;line-height:20px;\">&ldquo;"
                    + escapeHtml(note) + "&rdquo;</div>";
            noteTxt = "NOTE FROM LEADER:\n\"" + note + "\"\n";
        }

        String fallbackHtml = "";
        String fallbackTxt = "";
        if (joinCode != null && !joinCode.isBlank()) {
            fallbackHtml = "<div style=\"margin-top:20px;padding-top:16px;border-top:1px solid #E2DDD3;text-align:center;font-size:13px;color:#6A665E;line-height:18px;\">"
                    + "Prefer a code? Open [brackit], press <strong>Join with code</strong> and enter <code style=\"font-family:'SFMono-Regular', Menlo, Consolas, monospace;color:#0B0B0C;background:#EFECE3;padding:2px 6px;border-radius:4px;\">"
                    + escapeHtml(joinCode) + "</code>.</div>";
            fallbackTxt = "Prefer a code? Open [brackit], press Join with code and enter " + joinCode + ".";
        }

        String templateHtml = loadResource("classpath:mail/invite.html");
        String contentHtml = templateHtml
                .replace("{{ROOM_NAME}}", escapeHtml(roomName))
                .replace("{{INVITER}}", escapeHtml(inviter))
                .replace("{{TEMPLATE_NAME}}", escapeHtml(templateName))
                .replace("{{DURATION}}", escapeHtml(duration))
                .replace("{{SEATS_FILLED_TEXT}}", escapeHtml(seatsFilled))
                .replace("{{STUB_CODE}}", escapeHtml(stubCode))
                .replace("{{NOTE_BLOCK}}", noteHtml)
                .replace("{{INVITE_URL}}", escapeHtml(inviteUrl))
                .replace("{{EXPIRY_DATE}}", escapeHtml(expiryDate))
                .replace("{{FALLBACK_CODE_BLOCK}}", fallbackHtml);

        String fullHtml = wrapLayout(subject, preheader, contentHtml, "");

        String templateTxt = loadResource("classpath:mail/invite.txt");
        String fullTxt = templateTxt
                .replace("{{ROOM_NAME}}", roomName)
                .replace("{{INVITER}}", inviter)
                .replace("{{TEMPLATE_NAME}}", templateName)
                .replace("{{DURATION}}", duration)
                .replace("{{SEATS_FILLED_TEXT}}", seatsFilled)
                .replace("{{STUB_CODE}}", stubCode)
                .replace("{{NOTE_TEXT}}", noteTxt)
                .replace("{{INVITE_URL}}", inviteUrl)
                .replace("{{EXPIRY_DATE}}", expiryDate)
                .replace("{{FALLBACK_CODE_TEXT}}", fallbackTxt);

        return new RenderedEmail(subject, fullHtml, fullTxt);
    }

    public RenderedEmail renderJoined(Map<String, Object> vars) {
        String variant = str(vars.get("variant"), "SELF").toUpperCase();
        String roomName = str(vars.get("roomName"), "Room");
        String roomId = str(vars.get("roomId"), "");
        String appUrl = str(vars.get("appUrl"), publicUrl());

        if ("LEADER".equalsIgnoreCase(variant)) {
            String handle = str(vars.get("handle"), "teammate");
            String displayName = str(vars.get("displayName"), handle);
            int count = intVal(vars.get("memberCount"), 2);
            int cap = intVal(vars.get("memberCap"), 4);
            int remaining = Math.max(0, cap - count);
            String roleTags = formatRoleTags(vars.get("roleTags"));

            String subject = "@" + handle + " joined " + roomName;
            String preheader = displayName + " just joined " + roomName + " on [brackit].";
            String headerBadge = "TEAM UPDATE";
            String headline = displayName + " just joined.";
            String detailBlock = "<div style=\"font-family:'SFMono-Regular', Menlo, Consolas, monospace;font-size:13px;color:#6A665E;margin-bottom:12px;\">"
                    + roleTags + "</div>";
            String boxTitle = "ROSTER STATUS";
            String boxContent = count + " of " + cap + " seats filled &middot; " + remaining + " seats remain.";
            String actionText = "Open Team";
            String actionUrl = appUrl + "/room/" + roomId;

            String templateHtml = loadResource("classpath:mail/joined.html");
            String contentHtml = templateHtml
                    .replace("{{HEADER_BADGE}}", escapeHtml(headerBadge))
                    .replace("{{HEADLINE}}", escapeHtml(headline))
                    .replace("{{DETAIL_BLOCK}}", detailBlock)
                    .replace("{{BOX_TITLE}}", escapeHtml(boxTitle))
                    .replace("{{BOX_CONTENT}}", boxContent)
                    .replace("{{ACTION_TEXT}}", escapeHtml(actionText))
                    .replace("{{ACTION_URL}}", escapeHtml(actionUrl));

            String fullHtml = wrapLayout(subject, preheader, contentHtml, "");

            String templateTxt = loadResource("classpath:mail/joined.txt");
            String fullTxt = templateTxt
                    .replace("{{HEADER_BADGE}}", headerBadge)
                    .replace("{{HEADLINE}}", headline)
                    .replace("{{DETAIL_TEXT}}", "ROLES: " + unescapeTags(roleTags))
                    .replace("{{BOX_TITLE}}", boxTitle)
                    .replace("{{BOX_CONTENT}}", count + " of " + cap + " seats filled. " + remaining + " seats remain.")
                    .replace("{{ACTION_TEXT}}", actionText)
                    .replace("{{ACTION_URL}}", actionUrl);

            return new RenderedEmail(subject, fullHtml, fullTxt);
        } else {
            // SELF
            String subject = "You're in " + roomName;
            String preheader = "You're confirmed for " + roomName + " on [brackit].";
            String headerBadge = "ROOM MEMBERSHIP";
            String headline = "You're in.";

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> teammates = (List<Map<String, Object>>) vars.get("teammates");
            String rosterHtml = renderTeammateRoster(teammates);
            String rosterTxt = renderTeammateRosterText(teammates);

            String nextStep = str(vars.get("nextStep"), "Review the brief and add initial ideas on the Ideate board.");
            String boxTitle = "NEXT STEP";
            String boxContent = escapeHtml(nextStep);
            String actionText = "Open the room";
            String actionUrl = appUrl + "/room/" + roomId;

            String templateHtml = loadResource("classpath:mail/joined.html");
            String contentHtml = templateHtml
                    .replace("{{HEADER_BADGE}}", escapeHtml(headerBadge))
                    .replace("{{HEADLINE}}", escapeHtml(headline))
                    .replace("{{DETAIL_BLOCK}}", rosterHtml)
                    .replace("{{BOX_TITLE}}", escapeHtml(boxTitle))
                    .replace("{{BOX_CONTENT}}", boxContent)
                    .replace("{{ACTION_TEXT}}", escapeHtml(actionText))
                    .replace("{{ACTION_URL}}", escapeHtml(actionUrl));

            String fullHtml = wrapLayout(subject, preheader, contentHtml, "");

            String templateTxt = loadResource("classpath:mail/joined.txt");
            String fullTxt = templateTxt
                    .replace("{{HEADER_BADGE}}", headerBadge)
                    .replace("{{HEADLINE}}", headline)
                    .replace("{{DETAIL_TEXT}}", rosterTxt)
                    .replace("{{BOX_TITLE}}", boxTitle)
                    .replace("{{BOX_CONTENT}}", nextStep)
                    .replace("{{ACTION_TEXT}}", actionText)
                    .replace("{{ACTION_URL}}", actionUrl);

            return new RenderedEmail(subject, fullHtml, fullTxt);
        }
    }

    public RenderedEmail renderReminder(Map<String, Object> vars) {
        String kind = str(vars.get("kind"), "FREEZE_24H").toUpperCase();
        String roomName = str(vars.get("roomName"), "Room");
        String countdown = str(vars.get("countdown"), "03:00:00");
        String asOfTime = str(vars.get("asOfTime"), IST_FORMATTER.format(Instant.now()) + " IST");
        int elapsedPercent = Math.min(100, Math.max(0, intVal(vars.get("elapsedPercent"), 50)));
        int remainingPercent = Math.max(0, 100 - elapsedPercent);

        String boardUrl = str(vars.get("boardUrl"), publicUrl());
        String unsubscribeUrl = str(vars.get("unsubscribeUrl"), publicUrl() + "/unsubscribed");

        String subject;
        String countdownLabel;
        if ("SUBMIT_3H".equalsIgnoreCase(kind)) {
            subject = "Submission for " + roomName + " in 3 hours";
            countdownLabel = "until submission";
        } else if ("FREEZE_3H".equalsIgnoreCase(kind)) {
            subject = "Feature freeze for " + roomName + " in 3 hours";
            countdownLabel = "until feature freeze";
        } else {
            subject = "Feature freeze for " + roomName + " in 24 hours";
            countdownLabel = "until feature freeze";
        }
        String preheader = countdown + " remaining before " + countdownLabel + " on " + roomName + ".";

        Integer openTasksCount = (Integer) vars.get("openTasksCount");
        Integer confirmTasksCount = (Integer) vars.get("confirmTasksCount");
        String nextStep = str(vars.get("nextStep"), null);

        StringBuilder rowsHtml = new StringBuilder();
        StringBuilder textRows = new StringBuilder();

        if (openTasksCount != null) {
            String text = openTasksCount + (openTasksCount == 1 ? " task assigned to you" : " tasks assigned to you");
            rowsHtml.append("<tr><td style=\"font-size:14px;color:#2C2A26;padding:4px 0;\">&bull; ").append(escapeHtml(text)).append("</td></tr>");
            textRows.append("- ").append(text).append("\n");
        }
        if (confirmTasksCount != null && confirmTasksCount > 0) {
            String text = confirmTasksCount + (confirmTasksCount == 1 ? " task waiting for your confirmation" : " tasks waiting for your confirmation");
            rowsHtml.append("<tr><td style=\"font-size:14px;color:#2C2A26;padding:4px 0;\">&bull; ").append(escapeHtml(text)).append("</td></tr>");
            textRows.append("- ").append(text).append("\n");
        }
        if (nextStep != null && !nextStep.isBlank()) {
            rowsHtml.append("<tr><td style=\"font-size:14px;color:#2C2A26;padding:4px 0;\">&bull; Next: ").append(escapeHtml(nextStep)).append("</td></tr>");
            textRows.append("- Next: ").append(nextStep).append("\n");
        }
        if (rowsHtml.isEmpty()) {
            rowsHtml.append("<tr><td style=\"font-size:14px;color:#2C2A26;padding:4px 0;\">&bull; Clock is ticking. Stay focused and ship.</td></tr>");
            textRows.append("- Clock is ticking. Stay focused and ship.\n");
        }

        String templateHtml = loadResource("classpath:mail/reminder.html");
        String contentHtml = templateHtml
                .replace("{{COUNTDOWN}}", escapeHtml(countdown))
                .replace("{{COUNTDOWN_LABEL}}", escapeHtml(countdownLabel))
                .replace("{{AS_OF_TIME}}", escapeHtml(asOfTime))
                .replace("{{ELAPSED_PERCENT}}", String.valueOf(elapsedPercent))
                .replace("{{REMAINING_PERCENT}}", String.valueOf(remainingPercent))
                .replace("{{CHECKLIST_ROWS}}", rowsHtml.toString())
                .replace("{{BOARD_URL}}", escapeHtml(boardUrl));

        String footerExtra = "<p style=\"margin:8px 0 0 0;font-size:11px;color:#8E8980;\">"
                + "You received this because you enabled email reminders for your rooms. "
                + "<a href=\"" + escapeHtml(unsubscribeUrl) + "\" style=\"color:#8E8980;text-decoration:underline;\">Unsubscribe with one click</a>.</p>";

        String fullHtml = wrapLayout(subject, preheader, contentHtml, footerExtra);

        String templateTxt = loadResource("classpath:mail/reminder.txt");
        String fullTxt = templateTxt
                .replace("{{COUNTDOWN}}", countdown)
                .replace("{{COUNTDOWN_LABEL}}", countdownLabel)
                .replace("{{AS_OF_TIME}}", asOfTime)
                .replace("{{ELAPSED_PERCENT}}", String.valueOf(elapsedPercent))
                .replace("{{CHECKLIST_TEXT}}", textRows.toString().trim())
                .replace("{{BOARD_URL}}", boardUrl)
                .replace("{{UNSUBSCRIBE_URL}}", unsubscribeUrl);

        return new RenderedEmail(subject, fullHtml, fullTxt);
    }

    @SuppressWarnings("unchecked")
    public RenderedEmail renderUpdate(Map<String, Object> vars) {
        String roomName = str(vars.get("roomName"), "Room");
        String headline = str(vars.get("headline"), null);
        String roomUrl = str(vars.get("roomUrl"), publicUrl() + "/app");
        String notifUrl = str(vars.get("notificationsSettingsUrl"), publicUrl() + "/app/settings/notifications");

        List<Map<String, Object>> items = new ArrayList<>();
        if (vars.get("items") instanceof List<?> list) {
            for (Object obj : list) {
                if (obj instanceof Map<?, ?> m) {
                    items.add((Map<String, Object>) m);
                }
            }
        }

        int count = items.size();
        String subject = str(vars.get("subject"), null);
        if (subject == null || subject.isBlank()) {
            if (count <= 1) {
                String firstText = items.isEmpty() ? "New update" : str(items.get(0).get("text"), "New update");
                subject = firstText;
                if (headline == null || headline.isBlank()) {
                    headline = firstText;
                }
            } else {
                subject = count + " updates in " + roomName;
                if (headline == null || headline.isBlank()) {
                    headline = count + " updates in " + roomName;
                }
            }
        } else if (headline == null || headline.isBlank()) {
            headline = subject;
        }

        String preheader = count == 1 ? "1 new update in " + roomName : count + " updates in " + roomName;

        StringBuilder rowsHtml = new StringBuilder();
        StringBuilder textRows = new StringBuilder();

        int limit = Math.min(items.size(), 8);
        for (int i = 0; i < limit; i++) {
            Map<String, Object> item = items.get(i);
            String time = str(item.get("time"), "");
            String category = str(item.get("category"), "UPDATE").toUpperCase();
            String text = str(item.get("text"), "");
            String link = str(item.get("link"), roomUrl);

            rowsHtml.append("<tr>")
                    .append("<td style=\"padding:12px 0;border-bottom:1px solid #E5E0D8;font-family:'SFMono-Regular', Menlo, Consolas, monospace;font-size:12px;color:#8E8980;width:72px;vertical-align:top;white-space:nowrap;\">")
                    .append(escapeHtml(time))
                    .append("</td>")
                    .append("<td style=\"padding:12px 10px;border-bottom:1px solid #E5E0D8;vertical-align:top;width:90px;\">")
                    .append("<span style=\"display:inline-block;padding:2px 6px;border-radius:4px;background-color:#EAE6DF;font-family:'SFMono-Regular', Menlo, Consolas, monospace;font-size:10px;font-weight:600;color:#55524B;letter-spacing:0.5px;\">")
                    .append(escapeHtml(category))
                    .append("</span>")
                    .append("</td>")
                    .append("<td style=\"padding:12px 0;border-bottom:1px solid #E5E0D8;font-size:14px;line-height:20px;color:#2C2A26;vertical-align:top;\">")
                    .append("<a href=\"").append(escapeHtml(link)).append("\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#0B0B0C;text-decoration:underline;\">")
                    .append(escapeHtml(text))
                    .append("</a>")
                    .append("</td>")
                    .append("</tr>");

            textRows.append("[").append(time).append("] [").append(category).append("] ")
                    .append(text).append(" (").append(link).append(")\n");
        }

        if (rowsHtml.length() == 0) {
            rowsHtml.append("<tr><td style=\"padding:16px 0;font-size:14px;color:#6A665E;\">No new updates.</td></tr>");
            textRows.append("No new updates.\n");
        }

        String templateHtml = loadResource("classpath:mail/update.html");
        String contentHtml = templateHtml
                .replace("{{HEADLINE}}", escapeHtml(headline))
                .replace("{{ROOM_NAME}}", escapeHtml(roomName))
                .replace("{{LEDGER_ROWS}}", rowsHtml.toString())
                .replace("{{ROOM_URL}}", escapeHtml(roomUrl));

        String footerExtra = "<p style=\"margin:8px 0 0 0;font-size:11px;color:#8E8980;\">"
                + "You received this update because of your room notification settings. "
                + "<a href=\"" + escapeHtml(notifUrl) + "\" style=\"color:#8E8980;text-decoration:underline;\">Manage email preferences</a>.</p>";

        String fullHtml = wrapLayout(subject, preheader, contentHtml, footerExtra);

        String templateTxt = loadResource("classpath:mail/update.txt");
        String fullTxt = templateTxt
                .replace("{{HEADLINE}}", headline)
                .replace("{{ROOM_NAME}}", roomName)
                .replace("{{LEDGER_TEXT}}", textRows.toString().trim())
                .replace("{{ROOM_URL}}", roomUrl)
                .replace("{{NOTIFICATIONS_SETTINGS_URL}}", notifUrl);

        return new RenderedEmail(subject, fullHtml, fullTxt);
    }

    private String wrapLayout(String subject, String preheader, String contentHtml, String footerExtra) {
        String layout = loadResource("classpath:mail/layout.html");
        return layout
                .replace("{{SUBJECT}}", escapeHtml(subject))
                .replace("{{PREHEADER}}", escapeHtml(preheader))
                .replace("{{CONTENT}}", contentHtml)
                .replace("{{FOOTER_EXTRA}}", footerExtra != null ? footerExtra : "");
    }

    private String renderTeammateRoster(List<Map<String, Object>> teammates) {
        if (teammates == null || teammates.isEmpty()) {
            return "<div style=\"font-size:14px;color:#6A665E;margin-bottom:16px;\">Team members are ready to collaborate.</div>";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"margin-bottom:16px;\">");
        int count = 0;
        for (Map<String, Object> m : teammates) {
            if (count++ >= 6) break;
            String avatarUrl = (String) m.get("avatarUrl");
            String handle = str(m.get("handle"), "teammate");
            String displayName = str(m.get("displayName"), handle);
            String role = str(m.get("role"), "Member");
            boolean isLeader = Boolean.TRUE.equals(m.get("isLeader"));

            sb.append("<tr>");
            sb.append("<td width=\"44\" style=\"padding:6px 0;\">");
            sb.append(renderAvatar(avatarUrl, displayName, handle));
            sb.append("</td>");
            sb.append("<td style=\"padding:6px 12px;font-family:-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;\">");
            sb.append("<div style=\"font-size:14px;font-weight:600;color:#0B0B0C;\">@").append(escapeHtml(handle));
            if (isLeader) {
                sb.append(" <span style=\"display:inline-block;padding:1px 6px;background:#0B0B0C;color:#E8A33D;border-radius:4px;font-size:10px;font-weight:700;\">LEADER</span>");
            }
            sb.append("</div>");
            sb.append("<div style=\"font-size:12px;color:#6A665E;\">").append(escapeHtml(role)).append("</div>");
            sb.append("</td>");
            sb.append("</tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }

    private String renderTeammateRosterText(List<Map<String, Object>> teammates) {
        if (teammates == null || teammates.isEmpty()) {
            return "TEAM: Collaborators ready in the room.";
        }
        StringBuilder sb = new StringBuilder("TEAM ROSTER:\n");
        int count = 0;
        for (Map<String, Object> m : teammates) {
            if (count++ >= 6) break;
            String handle = str(m.get("handle"), "teammate");
            String role = str(m.get("role"), "Member");
            boolean isLeader = Boolean.TRUE.equals(m.get("isLeader"));
            sb.append("- @").append(handle).append(" (").append(role).append(")");
            if (isLeader) sb.append(" [LEADER]");
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    public static String renderAvatar(String avatarUrl, String displayName, String handle) {
        if (avatarUrl != null && (avatarUrl.startsWith("https://") || avatarUrl.startsWith("http://"))) {
            String safeUrl = escapeHtml(avatarUrl);
            return "<img src=\"" + safeUrl + "\" width=\"36\" height=\"36\" style=\"border-radius:50%;width:36px;height:36px;object-fit:cover;display:block;border:1px solid #D6D0C4;\" alt=\"\" />";
        }
        String initials = computeInitials(displayName, handle);
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:36px;height:36px;border-radius:50%;background-color:#E2DDD3;text-align:center;\">"
                + "<tr><td align=\"center\" valign=\"middle\" style=\"font-family:'SFMono-Regular', Menlo, Consolas, monospace;font-size:13px;font-weight:700;color:#0B0B0C;line-height:36px;width:36px;height:36px;\">"
                + escapeHtml(initials) + "</td></tr></table>";
    }

    private static String computeInitials(String displayName, String handle) {
        String source = (displayName != null && !displayName.isBlank()) ? displayName.trim() : (handle != null ? handle.trim() : "H");
        String[] parts = source.split("\\s+");
        if (parts.length >= 2 && !parts[0].isEmpty() && !parts[1].isEmpty()) {
            return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
        }
        if (source.length() >= 2) {
            return source.substring(0, 2).toUpperCase();
        }
        return source.toUpperCase();
    }

    public static String renderBarcode(String handle) {
        String h = (handle != null && !handle.isBlank()) ? handle.toLowerCase() : "hacker";
        long hash = 0xcbf29ce484222325L;
        for (int i = 0; i < h.length(); i++) {
            hash ^= h.charAt(i);
            hash *= 0x100000001b3L;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 36; i++) {
            int width = (int) (Math.abs((hash ^ (i * 31L))) % 4) + 1; // 1 to 4 px
            boolean isBar = ((hash >> (i % 60)) & 1L) == 1L || i == 0 || i == 35;
            String color = isBar ? "#0B0B0C" : "transparent";
            sb.append("<td width=\"").append(width)
                    .append("\" height=\"32\" bgcolor=\"").append(color)
                    .append("\" style=\"width:").append(width)
                    .append("px;height:32px;background-color:").append(color)
                    .append(";padding:0;\"></td>");
        }
        return sb.toString();
    }

    private String formatRoleTags(Object tagsObj) {
        List<String> list = new ArrayList<>();
        if (tagsObj instanceof Collection<?> col) {
            for (Object item : col) {
                if (item != null && !item.toString().isBlank()) list.add(escapeHtml(item.toString().trim()));
            }
        } else if (tagsObj instanceof String s && !s.isBlank()) {
            list.add(escapeHtml(s.trim()));
        }
        if (list.isEmpty()) {
            return "Builder";
        }
        return String.join(" &middot; ", list);
    }

    private String unescapeTags(String formatted) {
        return formatted.replace("&middot;", "·").replace("&amp;", "&");
    }

    private String loadResource(String path) {
        try {
            Resource res = resourceLoader.getResource(path);
            try (InputStream is = res.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.error("Failed to load email resource {}: {}", path, e.getMessage());
            return "";
        }
    }

    private static String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String str(Object obj, String fallback) {
        if (obj == null) return fallback;
        String s = obj.toString().trim();
        return s.isEmpty() ? fallback : s;
    }

    private static int intVal(Object obj, int fallback) {
        if (obj instanceof Number n) return n.intValue();
        if (obj != null) {
            try {
                return Integer.parseInt(obj.toString());
            } catch (Exception ignored) {}
        }
        return fallback;
    }
}
