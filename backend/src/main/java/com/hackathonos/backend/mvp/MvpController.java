package com.hackathonos.backend.mvp;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.mvp.dto.MvpDtos.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/mvp")
public class MvpController {

    private final MvpService mvpService;
    private final CurrentUser currentUser;

    public MvpController(MvpService mvpService, CurrentUser currentUser) {
        this.mvpService = mvpService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public MvpStateResponseDto getMvp(@PathVariable UUID roomId) {
        return mvpService.getMvp(roomId, currentUser.get());
    }

    @PutMapping
    public MvpStateResponseDto updateFullMvp(@PathVariable UUID roomId, @RequestBody UpdateFullMvpRequest request) {
        return mvpService.updateFullMvp(roomId, currentUser.get(), request);
    }

    @PutMapping("/pitch")
    public MvpStateResponseDto updatePitch(@PathVariable UUID roomId, @RequestBody UpdatePitchRequest request) {
        return mvpService.updatePitch(roomId, currentUser.get(), request);
    }

    @PutMapping("/core-flow")
    public MvpStateResponseDto updateCoreFlow(@PathVariable UUID roomId, @RequestBody UpdateCoreFlowRequest request) {
        return mvpService.updateCoreFlow(roomId, currentUser.get(), request);
    }

    @PutMapping("/ledger")
    public MvpStateResponseDto updateLedger(@PathVariable UUID roomId, @RequestBody UpdateLedgerRequest request) {
        return mvpService.updateLedger(roomId, currentUser.get(), request);
    }

    @PutMapping("/health")
    public MvpStateResponseDto updateHealth(@PathVariable UUID roomId, @RequestBody UpdateHealthRequest request) {
        return mvpService.updateHealth(roomId, currentUser.get(), request);
    }

    @PutMapping("/judge-prep")
    public MvpStateResponseDto updateJudgePrep(@PathVariable UUID roomId, @RequestBody UpdateJudgePrepRequest request) {
        return mvpService.updateJudgePrep(roomId, currentUser.get(), request);
    }

    @PutMapping("/cut-list")
    public MvpStateResponseDto updateCutList(@PathVariable UUID roomId, @RequestBody UpdateCutListRequest request) {
        return mvpService.updateCutList(roomId, currentUser.get(), request);
    }
}
