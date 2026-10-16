package com.hackathonos.backend.portfolio;

import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for managing personal user portfolio, settings, and room curation.
 */
@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping({"", "/me"})
    public PortfolioDtos.FullPortfolioResponse getMyPortfolio(
            @AuthenticationPrincipal User user
    ) {
        return portfolioService.getMyPortfolio(user);
    }

    @GetMapping("/u/{username}")
    public PortfolioDtos.FullPortfolioResponse getPublicPortfolio(
            @PathVariable String username
    ) {
        return portfolioService.getPublicPortfolioByUsername(username);
    }

    @RequestMapping(value = "/settings", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public PortfolioDtos.PortfolioSettingsDto updateSettings(
            @AuthenticationPrincipal User user,
            @RequestBody PortfolioDtos.UpdateSettingsRequest req
    ) {
        return portfolioService.updateSettings(user, req);
    }

    @RequestMapping(value = "/projects/{roomId}", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public void updateProjectCuration(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PortfolioDtos.UpdateProjectCurationRequest req
    ) {
        portfolioService.updateProjectCuration(roomId, user, req);
    }

    // Retain compatibility with legacy setVisibility
    @PatchMapping("/{roomId}")
    public void setVisibility(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PortfolioDtos.UpdateProjectCurationRequest req
    ) {
        portfolioService.updateProjectCuration(roomId, user, req);
    }
}
