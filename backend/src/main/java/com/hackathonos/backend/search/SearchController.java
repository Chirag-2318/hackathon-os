package com.hackathonos.backend.search;

import com.hackathonos.backend.search.SearchDtos.SearchResponseDto;
import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public SearchResponseDto search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return searchService.search(q, roomId, user);
    }
}
