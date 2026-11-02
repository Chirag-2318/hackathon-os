package com.hackathonos.backend.events;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomChangeInterceptorTest {

    @Mock
    private RoomEventHub eventHub;

    @Mock
    private CurrentUser currentUser;

    private RoomChangeInterceptor interceptor;
    private UUID roomId;
    private User testUser;

    @BeforeEach
    void setUp() {
        interceptor = new RoomChangeInterceptor(eventHub, currentUser);
        roomId = UUID.randomUUID();
        testUser = new User("DEV", "author@example.com", "Test Author", null, null, null);
        testUser.setId(UUID.randomUUID());
        when(currentUser.getOptional()).thenReturn(Optional.of(testUser));
    }

    @Test
    @DisplayName("Coalesces 'overview' topic to at most 1 event per room within 2000ms")
    void testOverviewCoalescingWithin2Seconds() {
        MockHttpServletRequest request1 = new MockHttpServletRequest("POST", "/api/v1/rooms/" + roomId + "/tasks");
        MockHttpServletResponse response1 = new MockHttpServletResponse();
        response1.setStatus(201);

        MockHttpServletRequest request2 = new MockHttpServletRequest("POST", "/api/v1/rooms/" + roomId + "/tasks");
        MockHttpServletResponse response2 = new MockHttpServletResponse();
        response2.setStatus(201);

        // First mutating request publishes topic "board" and "overview"
        interceptor.afterCompletion(request1, response1, new Object(), null);

        // Rapid second mutating request (within milliseconds)
        interceptor.afterCompletion(request2, response2, new Object(), null);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(eventHub, atLeastOnce()).publish(eq(roomId), topicCaptor.capture(), any(), any());

        List<String> capturedTopics = topicCaptor.getAllValues();
        long overviewCount = capturedTopics.stream().filter("overview"::equals).count();

        // Exactly one overview event should be published within the 2-second window
        assertThat(overviewCount).isEqualTo(1L);
    }
}

