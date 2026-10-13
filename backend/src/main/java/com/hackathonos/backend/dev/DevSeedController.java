package com.hackathonos.backend.dev;

import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dev/seed")
@Profile("dev")
public class DevSeedController {

    private final DevSeedService devSeedService;
    private final CurrentUser currentUser;
    private final boolean seedEnabled;

    public DevSeedController(
            DevSeedService devSeedService,
            CurrentUser currentUser,
            @Value("${app.seed.enabled:false}") boolean seedEnabled
    ) {
        this.devSeedService = devSeedService;
        this.currentUser = currentUser;
        this.seedEnabled = seedEnabled;
    }

    private void checkEnabled() {
        if (!seedEnabled || !devSeedService.isEnabled()) {
            throw new NotFoundException("NOT_FOUND", "Dev seed functionality is disabled.");
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> seedDemoRoom() {
        checkEnabled();
        User user = currentUser.get();
        UUID roomId = devSeedService.createDemoRoom(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "roomId", roomId,
                "message", "Demo room seeded successfully with realistic data."
        ));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearDemoRooms() {
        checkEnabled();
        User user = currentUser.get();
        devSeedService.deleteDemoRooms(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demo rooms removed."
        ));
    }
}
