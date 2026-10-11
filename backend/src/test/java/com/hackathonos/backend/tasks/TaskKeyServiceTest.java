package com.hackathonos.backend.tasks;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
class TaskKeyServiceTest {

    @Autowired
    private TaskKeyService taskKeyService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomService roomService;

    @Test
    void testConcurrentKeyGenerationProducesUniqueKeys() throws InterruptedException {
        User owner = userRepository.save(new User("DEV", "key_test_" + UUID.randomUUID() + "@dev.com", "Key Tester", null, null, null));
        var roomDto = roomService.createRoom(owner, new com.hackathonos.backend.rooms.dto.CreateRoomRequest("Concurrent Key Test", "CKT", null, "online-48h", null, null));
        Room room = roomRepository.findById(roomDto.id()).orElseThrow();

        int threadCount = 2;
        int keysPerThread = 25;
        int totalKeys = threadCount * keysPerThread;

        Set<String> generatedKeys = Collections.synchronizedSet(new HashSet<>());
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        final Room finalRoom = room;
        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    for (int j = 0; j < keysPerThread; j++) {
                        String key = taskKeyService.nextKey(finalRoom);
                        generatedKeys.add(key);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        latch.countDown();
        boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finished, "Threads should finish key generation in time");
        assertEquals(totalKeys, generatedKeys.size(), "All generated keys must be unique");
        assertTrue(generatedKeys.stream().allMatch(k -> k.startsWith("CKT-")));
    }
}
