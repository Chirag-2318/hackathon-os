package com.hackathonos.backend.readiness;

import com.hackathonos.backend.users.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for readiness evaluations and judge simulation.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/readiness")
public class ReadinessController {

    private final ReadinessService readinessService;

    public ReadinessController(ReadinessService readinessService) {
        this.readinessService = readinessService;
    }

    @GetMapping
    public ReadinessDtos.ReadinessResponse getReadiness(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return readinessService.getReadiness(roomId, user);
    }

    @GetMapping("/simulate/questions")
    public List<ReadinessDtos.QuestionDto> getSimulateQuestions(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return readinessService.getSimulateQuestions(roomId, user);
    }

    @PostMapping("/simulate/validate")
    public ReadinessDtos.ValidateSimulationResponse validateSimulation(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody ReadinessDtos.ValidateSimulationRequest req
    ) {
        return readinessService.validateSimulation(roomId, user, req);
    }
}
