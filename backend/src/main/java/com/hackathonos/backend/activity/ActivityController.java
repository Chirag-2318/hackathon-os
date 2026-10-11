package com.hackathonos.backend.activity;

import com.hackathonos.backend.activity.dto.ActivityItemDto;
import com.hackathonos.backend.common.dto.CursorPageResponse;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/activity")
public class ActivityController {

    private final ActivityService activityService;
    private final CurrentUser currentUser;

    public ActivityController(ActivityService activityService, CurrentUser currentUser) {
        this.activityService = activityService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public CursorPageResponse<ActivityItemDto> listRoomActivity(
            @PathVariable UUID roomId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String cursor) {
        User user = currentUser.get();
        return activityService.listRoomActivity(user, roomId, limit, cursor);
    }
}
