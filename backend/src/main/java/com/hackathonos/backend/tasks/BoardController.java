package com.hackathonos.backend.tasks;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.tasks.dto.BoardResponseDto;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller exposing project Kanban board overview endpoints.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/board")
public class BoardController {

    private final BoardService boardService;
    private final CurrentUser currentUser;

    public BoardController(BoardService boardService, CurrentUser currentUser) {
        this.boardService = boardService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public BoardResponseDto getBoard(@PathVariable UUID roomId) {
        return boardService.getBoard(roomId, currentUser.get());
    }
}
