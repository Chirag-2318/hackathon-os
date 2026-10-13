package com.hackathonos.backend.hackathons;

import com.hackathonos.backend.hackathons.dto.HackathonDtos.HackathonSourceItemDto;

import java.util.List;

public interface HackathonSource {
    List<HackathonSourceItemDto> fetch();
}
