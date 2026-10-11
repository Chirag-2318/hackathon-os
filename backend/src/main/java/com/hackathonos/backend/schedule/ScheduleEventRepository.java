package com.hackathonos.backend.schedule;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, UUID> {
    List<ScheduleEvent> findByRoomIdOrderByStartsAtAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
