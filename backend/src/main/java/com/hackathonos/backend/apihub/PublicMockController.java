package com.hackathonos.backend.apihub;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
public class PublicMockController {

    private final ApiHubService apiHubService;

    public PublicMockController(ApiHubService apiHubService) {
        this.apiHubService = apiHubService;
    }

    @RequestMapping(
            value = "/mock/{token}/**",
            method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE}
    )
    public ResponseEntity<String> handleMockRequest(
            @PathVariable String token,
            HttpServletRequest request
    ) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        // Path after /mock/{token}
        String prefix = "/mock/" + token;
        String matchPath = uri.startsWith(prefix) ? uri.substring(prefix.length()) : "/";
        if (matchPath.isBlank()) matchPath = "/";

        ApiHubService.MockResponse resp = apiHubService.serveMock(token, method, matchPath);
        return ResponseEntity.status(resp.status())
                .contentType(MediaType.APPLICATION_JSON)
                .body(resp.body());
    }
}
