package com.hackathonos.backend.home;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.home.HomeDtos.HomeResponseDto;
import com.hackathonos.backend.users.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/home")
public class HomeController {

    private final HomeService homeService;
    private final CurrentUser currentUser;

    public HomeController(HomeService homeService, CurrentUser currentUser) {
        this.homeService = homeService;
        this.currentUser = currentUser;
    }

    /**
     * Retrieves home screen dashboard data for the authenticated user and optional room selection.
     */
    @GetMapping
    public HomeResponseDto getHome(@RequestParam(required = false) UUID roomId) {
        User user = currentUser.get();
        return homeService.getHome(user, roomId);
    }
}
