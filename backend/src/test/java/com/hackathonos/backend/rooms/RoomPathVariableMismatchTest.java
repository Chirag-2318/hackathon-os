package com.hackathonos.backend.rooms;

import com.hackathonos.backend.common.error.ApiExceptionHandler;
import com.hackathonos.backend.notifications.NotificationController;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.tasks.BoardController;
import com.hackathonos.backend.tasks.BoardService;
import com.hackathonos.backend.common.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RoomPathVariableMismatchTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    @Mock
    private BoardService boardService;

    @Mock
    private CurrentUser currentUser;

    @BeforeEach
    void setUp() {
        NotificationController notificationController = new NotificationController(notificationService, currentUser);
        BoardController boardController = new BoardController(boardService, currentUser);

        mockMvc = MockMvcBuilders
                .standaloneSetup(notificationController, boardController)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/rooms/r-1/notifications returns 404 JSON with error body and requestId")
    void testRoomNotificationsInvalidIdReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/r-1/notifications"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Not found"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/rooms/not-a-uuid/board returns 404 JSON with error body and requestId")
    void testRoomBoardInvalidIdReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/not-a-uuid/board"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Not found"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }
}
