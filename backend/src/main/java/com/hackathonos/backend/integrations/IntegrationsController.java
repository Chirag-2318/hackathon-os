package com.hackathonos.backend.integrations;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class IntegrationsController {

    private final IntegrationsService integrationsService;
    private final CurrentUser currentUser;

    public IntegrationsController(IntegrationsService integrationsService,
                                  CurrentUser currentUser) {
        this.integrationsService = integrationsService;
        this.currentUser = currentUser;
    }

    @GetMapping({"/api/v1/users/me/integrations", "/users/me/integrations"})
    public IntegrationsService.IntegrationsResponse getIntegrations() {
        User user = currentUser.get();
        return integrationsService.getIntegrations(user);
    }

    @PostMapping({"/api/v1/integrations/github/authorize", "/integrations/github/authorize"})
    public IntegrationsService.AuthorizeResponse authorizeGitHub(
            @RequestParam(defaultValue = "public") String access,
            HttpServletRequest request) {
        User user = currentUser.get();
        return integrationsService.getAuthorizeUrl(user, access, request);
    }

    @DeleteMapping({"/api/v1/integrations/github/private-access", "/integrations/github/private-access"})
    public ResponseEntity<Void> removePrivateAccess() {
        User user = currentUser.get();
        integrationsService.removePrivateAccess(user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping({"/api/v1/integrations/github", "/integrations/github"})
    public ResponseEntity<Void> disconnectGitHub() {
        User user = currentUser.get();
        integrationsService.disconnectGitHub(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping({"/api/v1/integrations/github/check", "/integrations/github/check"})
    public IntegrationsService.CheckConnectionResponse checkGitHub() {
        User user = currentUser.get();
        return integrationsService.checkConnection(user);
    }

    @PostMapping({"/api/v1/integrations/github/token", "/integrations/github/token"})
    public IntegrationsService.IntegrationsResponse connectGitHubToken(
            @RequestBody IntegrationsService.ConnectGitHubTokenRequest request) {
        User user = currentUser.get();
        return integrationsService.connectWithToken(user, request);
    }
}
