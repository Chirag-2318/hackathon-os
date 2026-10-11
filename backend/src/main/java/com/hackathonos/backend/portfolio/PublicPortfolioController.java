package com.hackathonos.backend.portfolio;

import org.springframework.web.bind.annotation.*;

/**
 * Public showcase controller exposing read-only portfolio for a custom slug (permitAll).
 */
@RestController
@RequestMapping("/api/v1/public/portfolio")
public class PublicPortfolioController {

    private final PortfolioService portfolioService;

    public PublicPortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping("/{slug}")
    public PortfolioDtos.PublicPortfolioResponse getPublicPortfolio(
            @PathVariable String slug
    ) {
        return portfolioService.getPublicPortfolioBySlug(slug);
    }
}
