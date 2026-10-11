package com.hackathonos.backend.catalog;

import com.hackathonos.backend.common.error.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service providing curated hackathon strategy playbooks.
 */
@Service
public class PlaybookService {

    private final PlaybookRepository playbookRepository;

    public PlaybookService(PlaybookRepository playbookRepository) {
        this.playbookRepository = playbookRepository;
    }

    /**
     * Lists all published playbook templates in sort order.
     */
    @Transactional(readOnly = true)
    public List<CatalogDtos.PlaybookCardDto> listPlaybooks() {
        return playbookRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toCardDto).toList();
    }

    /**
     * Retrieves full playbook detail including 2 related playbooks of the same category.
     */
    @Transactional(readOnly = true)
    public CatalogDtos.PlaybookDetailDto getPlaybook(String slug) {
        Playbook pb = playbookRepository.findById(slug)
                .orElseThrow(() -> new NotFoundException("PLAYBOOK_NOT_FOUND", "Playbook not found: " + slug));

        List<CatalogDtos.PlaybookCardDto> related = playbookRepository
                .findByCategoryAndSlugNotOrderBySortOrderAsc(pb.getCategory(), pb.getSlug())
                .stream().limit(2).map(this::toCardDto).toList();

        return new CatalogDtos.PlaybookDetailDto(
                pb.getSlug(),
                pb.getTitle(),
                pb.getSummary(),
                pb.getContent(),
                pb.getCategory(),
                pb.getReadMinutes(),
                related
        );
    }

    private CatalogDtos.PlaybookCardDto toCardDto(Playbook p) {
        return new CatalogDtos.PlaybookCardDto(
                p.getSlug(),
                p.getSlug(),
                p.getTitle(),
                p.getSummary(),
                p.getCategory(),
                p.getCategory(),
                4,
                p.getReadMinutes()
        );
    }
}
