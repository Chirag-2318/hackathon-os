package com.hackathonos.backend.email;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.web.bind.annotation.*;

@RestController
public class EmailPreferenceController {

    private final EmailPreferenceService emailPreferenceService;
    private final CurrentUser currentUser;

    public EmailPreferenceController(EmailPreferenceService emailPreferenceService,
                                     CurrentUser currentUser) {
        this.emailPreferenceService = emailPreferenceService;
        this.currentUser = currentUser;
    }

    @GetMapping({"/api/v1/users/me/email-prefs", "/users/me/email-prefs"})
    public EmailPreferenceService.EmailPrefsResponse getPreferences() {
        User user = currentUser.get();
        return emailPreferenceService.getPreferences(user);
    }

    @PatchMapping({"/api/v1/users/me/email-prefs", "/users/me/email-prefs"})
    public EmailPreferenceService.EmailPrefsResponse updatePreferences(
            @RequestBody EmailPreferenceService.UpdateEmailPrefsRequest request) {
        User user = currentUser.get();
        return emailPreferenceService.updatePreferences(user, request);
    }

    @PostMapping({"/api/v1/users/me/email/test", "/users/me/email/test"})
    public EmailPreferenceService.TestEmailResponse sendTestEmail() {
        User user = currentUser.get();
        return emailPreferenceService.sendTestEmail(user);
    }
}
