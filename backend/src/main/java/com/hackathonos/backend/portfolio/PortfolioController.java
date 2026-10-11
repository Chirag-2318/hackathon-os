package com.hackathonos.backend.portfolio;

import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for managing personal user portfolio, settings, and room visibility.
 */
@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public PortfolioDtos.PortfolioDashboardResponse getMyPortfolio(
            @AuthenticationPrincipal User user
    ) {
        return portfolioService.getMyPortfolio(user);
    }

    @PatchMapping("/settings")
    public PortfolioDtos.PortfolioSettingsDto updateSettings(
            @AuthenticationPrincipal User user,
            @RequestBody PortfolioDtos.UpdateSettingsRequest req
    ) {
        return portfolioService.updateSettings(user, req);
    }

    @PatchMapping("/{roomId}")
    public void setVisibility(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody PortfolioDtos.SetVisibilityRequest req
    ) {
        portfolioService.setVisibility(roomId, user, req);
    }
}
