package com.hackathonos.backend.ideas;

import com.hackathonos.backend.ideas.dto.AuthorDto;
import com.hackathonos.backend.ideas.dto.IdeaDto;
import com.hackathonos.backend.ideas.dto.IdeaLinkDto;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Maps Idea entities and related links and notes into IdeaDto representations.
 */
@Component
public class IdeasMapper {

    public IdeaDto toDto(Idea idea, List<IdeaLink> links, List<IdeaNote> notes, User author, UUID currentUserId) {
        String name = author != null ? (author.getName() != null ? author.getName() : (author.getEmail() != null ? author.getEmail() : "Unknown")) : "Unknown";
        String avatarUrl = author != null ? author.getAvatarUrl() : null;
        String initials = computeInitials(name);
        AuthorDto authorDto = new AuthorDto(
                idea.getAuthorId().toString(),
                name,
                initials,
                avatarUrl
        );

        List<IdeaLinkDto> linkDtos = new ArrayList<>();
        if (links != null) {
            for (IdeaLink l : links) {
                linkDtos.add(new IdeaLinkDto(l.getUrl(), l.getTitle()));
            }
        }

        List<String> noteTexts = new ArrayList<>();
        if (notes != null) {
            for (IdeaNote n : notes) {
                noteTexts.add(n.getText());
            }
        }

        boolean isMine = currentUserId != null && currentUserId.equals(idea.getAuthorId());

        return new IdeaDto(
                idea.getId().toString(),
                idea.getRoomId().toString(),
                idea.getText(),
                linkDtos,
                noteTexts,
                idea.getStatus().toLowerCase(),
                idea.getRejectReason(),
                idea.isPrimary(),
                authorDto,
                idea.getAuthorId().toString(),
                isMine,
                idea.getCreatedAt() != null ? idea.getCreatedAt().toString() : null,
                idea.getDecidedAt() != null ? idea.getDecidedAt().toString() : null
        );
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) return "U";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }
}
