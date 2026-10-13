package com.hackathonos.backend.meta;

import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.common.config.AppProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meta")
public class MetaController {

    private final AiService aiService;
    private final AppProperties appProperties;

    public MetaController(AiService aiService, AppProperties appProperties) {
        this.aiService = aiService;
        this.appProperties = appProperties;
    }

    public record LimitsDto(
            int ideaMaxChars,
            int taskSummaryMax,
            int docMaxChars,
            int uploadMaxMb
    ) {}

    public record MetaResponse(
            List<String> roles,
            List<String> skills,
            List<String> priorities,
            List<String> taskStatuses,
            List<String> retroTags,
            List<String> diagramKinds,
            List<String> pitchFormats,
            List<String> crowdCliches,
            List<String> timezones,
            List<String> noteTypes,
            LimitsDto limits,
            boolean aiEnabled,
            boolean githubLinkEnabled,
            boolean canvaEnabled
    ) {}

    /**
     * Returns server metadata including supported enum options, limits, timezones, and aiEnabled status.
     */
    @GetMapping
    public MetaResponse getMeta() {
        return new MetaResponse(
                MetaConstants.ROLES,
                MetaConstants.SKILLS,
                MetaConstants.PRIORITIES,
                MetaConstants.TASK_STATUSES,
                MetaConstants.RETRO_TAGS,
                MetaConstants.DIAGRAM_KINDS,
                MetaConstants.PITCH_FORMATS,
                MetaConstants.CROWD_CLICHES,
                MetaConstants.TIMEZONES,
                MetaConstants.NOTE_TYPES,
                new LimitsDto(
                        MetaConstants.IDEA_MAX_CHARS,
                        MetaConstants.TASK_SUMMARY_MAX,
                        MetaConstants.DOC_MAX_CHARS,
                        MetaConstants.UPLOAD_MAX_MB
                ),
                aiService.isConfigured(),
                appProperties.getGithub().isLinkConfigured(),
                appProperties.getCanva().isConfigured()
        );
    }
}
