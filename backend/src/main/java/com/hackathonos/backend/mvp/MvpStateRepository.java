package com.hackathonos.backend.mvp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MvpStateRepository extends JpaRepository<MvpState, UUID> {
}
