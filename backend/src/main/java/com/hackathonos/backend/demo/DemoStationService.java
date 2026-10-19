package com.hackathonos.backend.demo;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.error.PayloadTooLargeException;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.pitch.PitchScript;
import com.hackathonos.backend.pitch.PitchScriptRepository;
import com.hackathonos.backend.rooms.RoomAccessService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DemoStationService {

    private static final Logger log = LoggerFactory.getLogger(DemoStationService.class);
    private static final int MAX_SCREENSHOTS = 12;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    private final DemoAssetRepository assetRepository;
    private final DemoLadderRepository ladderRepository;
    private final DemoPreflightRepository preflightRepository;
    private final DemoLinkCheckService linkCheckService;
    private final RoomAccessService roomAccessService;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final PitchScriptRepository pitchScriptRepository;
    private final UserRepository userRepository;
    private final RoomEventService roomEventService;
    private final AppProperties appProperties;

    public DemoStationService(
            DemoAssetRepository assetRepository,
            DemoLadderRepository ladderRepository,
            DemoPreflightRepository preflightRepository,
            DemoLinkCheckService linkCheckService,
            RoomAccessService roomAccessService,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            PitchScriptRepository pitchScriptRepository,
            UserRepository userRepository,
            RoomEventService roomEventService,
            AppProperties appProperties
    ) {
        this.assetRepository = assetRepository;
        this.ladderRepository = ladderRepository;
        this.preflightRepository = preflightRepository;
        this.linkCheckService = linkCheckService;
        this.roomAccessService = roomAccessService;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.pitchScriptRepository = pitchScriptRepository;
        this.userRepository = userRepository;
        this.roomEventService = roomEventService;
        this.appProperties = appProperties;
    }

    // ── ASSETS ────────────────────────────────────────────────────────

    @Transactional
    public List<DemoStationDtos.DemoAssetDto> getAssets(UUID roomId, User user) {
        roomAccessService.requireMember(roomId, user);

        List<DemoAsset> assets = assetRepository.findByRoomIdOrderByPositionAscCreatedAtAsc(roomId);

        // Check if any link asset needs auto-recheck (never checked or > 1 hour old)
        Instant oneHourAgo = Instant.now().minus(Duration.ofHours(1));
        boolean anyUpdated = false;
        for (DemoAsset a : assets) {
            if (!"SCREENSHOT".equals(a.getKind()) && a.getUrl() != null && !a.getUrl().isBlank()) {
                if (a.getCheckedAt() == null || a.getCheckedAt().isBefore(oneHourAgo)) {
                    try {
                        DemoLinkCheckService.LinkCheckResult res = linkCheckService.checkLink(
                                a.getUrl(), "LIVE_LINK".equals(a.getKind())
                        );
                        a.setStatus(res.status());
                        if (res.title() != null && (a.getTitle() == null || a.getTitle().isBlank())) {
                            a.setTitle(res.title());
                        }
                        a.setProvider(res.provider());
                        a.setCheckedAt(Instant.now());
                        anyUpdated = true;
                    } catch (Exception ex) {
                        log.warn("Auto-check failed for asset {}: {}", a.getId(), ex.getMessage());
                    }
                }
            }
        }
        if (anyUpdated) {
            assetRepository.saveAll(assets);
        }

        return assets.stream().map(this::toAssetDto).toList();
    }

    @Transactional
    public DemoStationDtos.DemoAssetDto addOrUpdateLink(UUID roomId, User user, DemoStationDtos.CreateLinkAssetRequest req) {
        roomAccessService.requireMember(roomId, user);

        if (req == null || req.kind() == null || req.kind().isBlank()) {
            throw new BadRequestException("INVALID_KIND", "Asset kind is required");
        }
        String kind = req.kind().trim().toUpperCase(Locale.ROOT);
        if (!List.of("FULL_RECORDING", "BACKUP_RECORDING", "LIVE_LINK").contains(kind)) {
            throw new BadRequestException("INVALID_KIND", "Invalid asset kind: " + kind);
        }

        String url = req.url() != null ? req.url().trim() : "";
        if (url.isBlank()) {
            throw new BadRequestException("EMPTY_URL", "Link URL cannot be empty");
        }

        boolean isLive = "LIVE_LINK".equals(kind);
        DemoLinkCheckService.LinkCheckResult check = linkCheckService.checkLink(url, isLive);

        DemoAsset asset = assetRepository.findFirstByRoomIdAndKind(roomId, kind).orElse(null);
        if (asset == null) {
            asset = new DemoAsset();
            asset.setRoomId(roomId);
            asset.setKind(kind);
            asset.setAddedBy(user.getId());
            asset.setPosition(kind.equals("FULL_RECORDING") ? 0 : (kind.equals("BACKUP_RECORDING") ? 1 : 2));
        }

        asset.setUrl(url);
        asset.setProvider(check.provider());
        asset.setStatus(check.status());
        asset.setTitle(req.title() != null && !req.title().isBlank() ? req.title().trim() : check.title());
        asset.setCheckedAt(Instant.now());

        DemoAsset saved = assetRepository.save(asset);

        recordRoomEvent(roomId, "DEMO_ASSET_UPDATED", saved.getId().toString(), user.getId());

        return toAssetDto(saved);
    }

    @Transactional
    public DemoStationDtos.DemoAssetDto uploadScreenshot(UUID roomId, User user, MultipartFile file) {
        roomAccessService.requireMember(roomId, user);

        long currentCount = assetRepository.countByRoomIdAndKind(roomId, "SCREENSHOT");
        if (currentCount >= MAX_SCREENSHOTS) {
            throw new BadRequestException("LIMIT_REACHED", "Maximum 12 screenshots allowed");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_FILE", "Please select an image file to upload");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new PayloadTooLargeException("PAYLOAD_TOO_LARGE", "Screenshot file exceeds 5MB limit");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("FILE_READ_ERROR", "Could not read uploaded screenshot");
        }

        boolean isPng = bytes.length >= 8 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
        boolean isJpeg = bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
        boolean isWebp = bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';

        if (!isPng && !isJpeg && !isWebp) {
            throw new BadRequestException("INVALID_IMAGE_TYPE", "Only PNG, JPEG, and WebP images are allowed.");
        }

        File uploadDir = new File(appProperties.getUploadDir(), "demo-screenshots");
        if (!uploadDir.exists() && !uploadDir.mkdirs()) {
            // created or exists
        }

        String filename = UUID.randomUUID().toString() + ".webp";
        File dest = new File(uploadDir, filename);

        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(bytes));
            if (original != null) {
                int w = original.getWidth();
                int h = original.getHeight();
                if (w > 1920 || h > 1920) {
                    double scale = Math.min(1920.0 / w, 1920.0 / h);
                    int targetW = Math.max(1, (int) (w * scale));
                    int targetH = Math.max(1, (int) (h * scale));
                    BufferedImage scaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g = scaled.createGraphics();
                    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    g.drawImage(original, 0, 0, targetW, targetH, null);
                    g.dispose();
                    original = scaled;
                }
                boolean written = false;
                if (ImageIO.getImageWritersByFormatName("webp").hasNext()) {
                    written = ImageIO.write(original, "webp", dest);
                }
                if (!written) {
                    // Fallback to PNG writing
                    filename = filename.replace(".webp", ".png");
                    dest = new File(uploadDir, filename);
                    ImageIO.write(original, "png", dest);
                }
            } else {
                Files.write(dest.toPath(), bytes);
            }
        } catch (Exception ex) {
            log.warn("Image re-encoding failed, writing raw bytes: {}", ex.getMessage());
            try {
                Files.write(dest.toPath(), bytes);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save screenshot file", e);
            }
        }

        DemoAsset asset = new DemoAsset();
        asset.setRoomId(roomId);
        asset.setKind("SCREENSHOT");
        asset.setFileKey(filename);
        asset.setStatus("REACHABLE");
        asset.setPosition((int) currentCount);
        asset.setAddedBy(user.getId());
        asset.setTitle(file.getOriginalFilename());
        asset.setCaption("");

        DemoAsset saved = assetRepository.save(asset);

        recordRoomEvent(roomId, "DEMO_ASSET_UPDATED", saved.getId().toString(), user.getId());

        return toAssetDto(saved);
    }

    @Transactional
    public DemoStationDtos.DemoAssetDto updateAsset(UUID roomId, User user, UUID assetId, DemoStationDtos.UpdateAssetRequest req) {
        roomAccessService.requireMember(roomId, user);

        DemoAsset asset = assetRepository.findById(assetId)
                .filter(a -> a.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ASSET_NOT_FOUND", "Asset not found"));

        if (req.caption() != null) {
            asset.setCaption(req.caption().trim());
        }
        if (req.position() != null) {
            asset.setPosition(req.position());
        }

        DemoAsset saved = assetRepository.save(asset);

        recordRoomEvent(roomId, "DEMO_ASSET_UPDATED", saved.getId().toString(), user.getId());

        return toAssetDto(saved);
    }

    @Transactional
    public void deleteAsset(UUID roomId, User user, UUID assetId) {
        roomAccessService.requireMember(roomId, user);

        DemoAsset asset = assetRepository.findById(assetId)
                .filter(a -> a.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ASSET_NOT_FOUND", "Asset not found"));

        if ("SCREENSHOT".equals(asset.getKind()) && asset.getFileKey() != null) {
            File file = new File(new File(appProperties.getUploadDir(), "demo-screenshots"), asset.getFileKey());
            if (file.exists()) {
                file.delete();
            }
        }

        assetRepository.delete(asset);

        recordRoomEvent(roomId, "DEMO_ASSET_DELETED", assetId.toString(), user.getId());
    }

    @Transactional
    public DemoStationDtos.DemoAssetDto checkAssetLink(UUID roomId, User user, UUID assetId) {
        roomAccessService.requireMember(roomId, user);

        DemoAsset asset = assetRepository.findById(assetId)
                .filter(a -> a.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ASSET_NOT_FOUND", "Asset not found"));

        if ("SCREENSHOT".equals(asset.getKind()) || asset.getUrl() == null || asset.getUrl().isBlank()) {
            throw new BadRequestException("NOT_A_LINK", "Only link assets can be checked");
        }

        linkCheckService.checkRateLimit(assetId.toString());

        boolean isLive = "LIVE_LINK".equals(asset.getKind());
        DemoLinkCheckService.LinkCheckResult result = linkCheckService.checkLink(asset.getUrl(), isLive);

        asset.setStatus(result.status());
        if (result.title() != null && !result.title().isBlank()) {
            asset.setTitle(result.title());
        }
        asset.setProvider(result.provider());
        asset.setCheckedAt(Instant.now());

        DemoAsset saved = assetRepository.save(asset);

        recordRoomEvent(roomId, "DEMO_ASSET_CHECKED", saved.getId().toString(), user.getId());

        return toAssetDto(saved);
    }

    public Resource getScreenshotFile(UUID roomId, User user, UUID assetId) {
        roomAccessService.requireMember(roomId, user);

        DemoAsset asset = assetRepository.findById(assetId)
                .filter(a -> a.getRoomId().equals(roomId) && "SCREENSHOT".equals(a.getKind()))
                .orElseThrow(() -> new NotFoundException("ASSET_NOT_FOUND", "Screenshot not found"));

        File file = new File(new File(appProperties.getUploadDir(), "demo-screenshots"), asset.getFileKey());
        if (!file.exists()) {
            throw new NotFoundException("FILE_NOT_FOUND", "Screenshot image file not found");
        }

        return new FileSystemResource(file);
    }

    public byte[] downloadAllScreenshotsZip(UUID roomId, User user) {
        roomAccessService.requireMember(roomId, user);

        List<DemoAsset> screenshots = assetRepository.findByRoomIdAndKindOrderByPositionAscCreatedAtAsc(roomId, "SCREENSHOT");
        if (screenshots.isEmpty()) {
            throw new BadRequestException("NO_SCREENSHOTS", "No screenshots found to download");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            File dir = new File(appProperties.getUploadDir(), "demo-screenshots");
            int idx = 1;
            for (DemoAsset s : screenshots) {
                if (s.getFileKey() == null) continue;
                File f = new File(dir, s.getFileKey());
                if (!f.exists()) continue;

                String ext = s.getFileKey().contains(".") ? s.getFileKey().substring(s.getFileKey().lastIndexOf(".")) : ".webp";
                String entryName = String.format("screenshot-%02d%s", idx++, ext);
                if (s.getCaption() != null && !s.getCaption().isBlank()) {
                    String cleanCap = s.getCaption().replaceAll("[^a-zA-Z0-9_-]", "-");
                    entryName = String.format("screenshot-%02d-%s%s", idx - 1, cleanCap, ext);
                }

                zos.putNextEntry(new ZipEntry(entryName));
                Files.copy(f.toPath(), zos);
                zos.closeEntry();
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to create zip archive", e);
        }

        return baos.toByteArray();
    }

    // ── FAILURE LADDER ────────────────────────────────────────────────

    @Transactional
    public List<DemoStationDtos.DemoLadderRungDto> getLadder(UUID roomId, User user) {
        roomAccessService.requireMember(roomId, user);

        List<DemoLadder> ladders = ladderRepository.findByRoomIdOrderByRungAsc(roomId);
        if (ladders.size() < 4) {
            seedLadderDefaults(roomId);
            ladders = ladderRepository.findByRoomIdOrderByRungAsc(roomId);
        }

        // Evaluate live statuses
        boolean liveReachable = assetRepository.findFirstByRoomIdAndKind(roomId, "LIVE_LINK")
                .map(a -> "REACHABLE".equals(a.getStatus())).orElse(false);

        boolean backupReachable = assetRepository.findFirstByRoomIdAndKind(roomId, "BACKUP_RECORDING")
                .map(a -> "REACHABLE".equals(a.getStatus())).orElse(false);

        boolean screenshotsReady = assetRepository.countByRoomIdAndKind(roomId, "SCREENSHOT") >= 3;

        boolean pitchHasBeats = hasPitchBeats(roomId);

        Map<String, String> userNames = getUserNameMap(roomId);

        List<DemoStationDtos.DemoLadderRungDto> dtos = new ArrayList<>();
        for (DemoLadder l : ladders) {
            String rung = l.getRung();
            boolean conditionMet = switch (rung) {
                case "A" -> liveReachable;
                case "B" -> backupReachable;
                case "C" -> screenshotsReady;
                case "D" -> pitchHasBeats;
                default -> false;
            };

            String status = "MISSING";
            if (conditionMet) {
                status = l.getTestedAt() != null ? "READY" : "UNTESTED";
            }

            String rungName = switch (rung) {
                case "A" -> "Live demo";
                case "B" -> "Backup recording";
                case "C" -> "Screenshots";
                case "D" -> "Talk it through";
                default -> "Fallback";
            };

            String testedByName = l.getTestedBy() != null ? userNames.getOrDefault(l.getTestedBy().toString(), "@teammate") : null;

            dtos.add(new DemoStationDtos.DemoLadderRungDto(
                    rung, rungName, status, l.getSayText(), l.getTestedAt(), l.getTestedBy(), testedByName
            ));
        }

        return dtos;
    }

    @Transactional
    public DemoStationDtos.DemoLadderRungDto updateLadderRung(UUID roomId, User user, String rung, DemoStationDtos.UpdateLadderRungRequest req) {
        roomAccessService.requireMember(roomId, user);
        String r = rung.trim().toUpperCase(Locale.ROOT);

        DemoLadder ladder = ladderRepository.findByRoomIdAndRung(roomId, r).orElseGet(() -> {
            DemoLadder l = new DemoLadder(roomId, r, "");
            return ladderRepository.save(l);
        });

        if (req != null && req.sayText() != null) {
            String say = req.sayText().trim();
            if (say.length() > 160) {
                say = say.substring(0, 160);
            }
            ladder.setSayText(say);
        }

        DemoLadder saved = ladderRepository.save(ladder);

        recordRoomEvent(roomId, "DEMO_LADDER_UPDATED", r, user.getId());

        // Return refreshed rung
        return getLadder(roomId, user).stream().filter(it -> it.rung().equals(r)).findFirst().orElse(null);
    }

    @Transactional
    public DemoStationDtos.DemoLadderRungDto testLadderRung(UUID roomId, User user, String rung) {
        roomAccessService.requireMember(roomId, user);
        String r = rung.trim().toUpperCase(Locale.ROOT);

        DemoLadder ladder = ladderRepository.findByRoomIdAndRung(roomId, r).orElseGet(() -> {
            DemoLadder l = new DemoLadder(roomId, r, "");
            return ladderRepository.save(l);
        });

        ladder.setTestedAt(Instant.now());
        ladder.setTestedBy(user.getId());

        ladderRepository.save(ladder);

        recordRoomEvent(roomId, "DEMO_LADDER_TESTED", r, user.getId());

        return getLadder(roomId, user).stream().filter(it -> it.rung().equals(r)).findFirst().orElse(null);
    }

    private void seedLadderDefaults(UUID roomId) {
        Map<String, String> defaultSay = new HashMap<>();
        defaultSay.put("A", "Here is our live product running.");
        defaultSay.put("B", "Our connection dropped, so here is the recording from this morning.");
        defaultSay.put("C", "Here are the screenshots captured from our working build.");
        defaultSay.put("D", "Let us walk you through the core workflow and architecture.");

        // Read DEMO_SCRIPT.md if present
        try {
            Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
            if (docOpt.isPresent()) {
                Doc doc = docOpt.get();
                String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                        .map(DocVersion::getContent).orElse("");
                Matcher insM = Pattern.compile("(?i)##\\s*(?:\\d+\\.\\s*)?Demo insurance([\\s\\S]*?)(?=\\n##|$)").matcher(content);
                if (insM.find()) {
                    String block = insM.group(1);
                    Matcher wifiM = Pattern.compile("(?i)wifi dies:?[^\\n]*?([A-Za-z0-9\\s,.!'-]{10,160})").matcher(block);
                    if (wifiM.find()) {
                        defaultSay.put("B", wifiM.group(1).trim());
                    }
                }
            }
        } catch (Exception ignored) {}

        List<String> rungs = List.of("A", "B", "C", "D");
        for (String r : rungs) {
            if (ladderRepository.findByRoomIdAndRung(roomId, r).isEmpty()) {
                ladderRepository.save(new DemoLadder(roomId, r, defaultSay.get(r)));
            }
        }
    }

    private boolean hasPitchBeats(UUID roomId) {
        Optional<PitchScript> script = pitchScriptRepository.findById(roomId);
        if (script.isPresent() && script.get().getSlides() != null && script.get().getSlides().length() > 50) {
            return true;
        }
        Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
        if (docOpt.isPresent()) {
            Doc doc = docOpt.get();
            String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                    .map(DocVersion::getContent).orElse("");
            Matcher bm = Pattern.compile("(?im)^###\\s*\\d+:\\d{2}").matcher(content);
            int count = 0;
            while (bm.find()) count++;
            return count >= 3;
        }
        return false;
    }

    // ── PREFLIGHT CHECKLIST ───────────────────────────────────────────

    @Transactional
    public List<DemoStationDtos.DemoPreflightItemDto> getPreflight(UUID roomId, User user) {
        roomAccessService.requireMember(roomId, user);

        List<DemoPreflight> items = preflightRepository.findByRoomIdOrderByPositionAsc(roomId);
        if (items.isEmpty()) {
            seedPreflightDefaults(roomId);
            items = preflightRepository.findByRoomIdOrderByPositionAsc(roomId);
        }

        Map<String, String> userNames = getUserNameMap(roomId);

        return items.stream().map(it -> new DemoStationDtos.DemoPreflightItemDto(
                it.getId(),
                it.getItemHash(),
                it.getLabel(),
                it.isChecked(),
                it.getCheckedBy(),
                it.getCheckedBy() != null ? userNames.getOrDefault(it.getCheckedBy().toString(), "@teammate") : null,
                it.getCheckedAt(),
                it.getSource(),
                it.getPosition()
        )).toList();
    }

    @Transactional
    public DemoStationDtos.DemoPreflightItemDto addPreflightItem(UUID roomId, User user, DemoStationDtos.CreatePreflightRequest req) {
        roomAccessService.requireMember(roomId, user);

        if (req == null || req.label() == null || req.label().isBlank()) {
            throw new BadRequestException("EMPTY_LABEL", "Checklist item label is required");
        }
        String label = req.label().trim();
        String hash = computeHash(label);

        List<DemoPreflight> existing = preflightRepository.findByRoomIdOrderByPositionAsc(roomId);
        int pos = existing.size();

        DemoPreflight item = preflightRepository.findByRoomIdAndItemHash(roomId, hash).orElseGet(() ->
                new DemoPreflight(roomId, hash, label, "USER", pos)
        );

        DemoPreflight saved = preflightRepository.save(item);

        recordRoomEvent(roomId, "DEMO_PREFLIGHT_UPDATED", saved.getId().toString(), user.getId());

        Map<String, String> userNames = getUserNameMap(roomId);
        return new DemoStationDtos.DemoPreflightItemDto(
                saved.getId(), saved.getItemHash(), saved.getLabel(), saved.isChecked(),
                saved.getCheckedBy(), saved.getCheckedBy() != null ? userNames.get(saved.getCheckedBy().toString()) : null,
                saved.getCheckedAt(), saved.getSource(), saved.getPosition()
        );
    }

    @Transactional
    public DemoStationDtos.DemoPreflightItemDto togglePreflight(UUID roomId, User user, UUID itemId, DemoStationDtos.TogglePreflightRequest req) {
        roomAccessService.requireMember(roomId, user);

        DemoPreflight item = preflightRepository.findById(itemId)
                .filter(it -> it.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Preflight item not found"));

        boolean checked = req != null && req.checked() != null ? req.checked() : !item.isChecked();
        item.setChecked(checked);
        item.setCheckedBy(checked ? user.getId() : null);
        item.setCheckedAt(checked ? Instant.now() : null);

        DemoPreflight saved = preflightRepository.save(item);

        recordRoomEvent(roomId, "DEMO_PREFLIGHT_UPDATED", saved.getId().toString(), user.getId());

        Map<String, String> userNames = getUserNameMap(roomId);
        return new DemoStationDtos.DemoPreflightItemDto(
                saved.getId(), saved.getItemHash(), saved.getLabel(), saved.isChecked(),
                saved.getCheckedBy(), saved.getCheckedBy() != null ? userNames.get(saved.getCheckedBy().toString()) : null,
                saved.getCheckedAt(), saved.getSource(), saved.getPosition()
        );
    }

    @Transactional
    public void resetPreflight(UUID roomId, User user) {
        roomAccessService.requireMember(roomId, user);

        if (!roomAccessService.isLeader(roomId, user.getId())) {
            throw new ForbiddenException("LEADER_REQUIRED", "Only the room leader can reset the preflight checklist.");
        }

        List<DemoPreflight> items = preflightRepository.findByRoomIdOrderByPositionAsc(roomId);
        for (DemoPreflight it : items) {
            it.setChecked(false);
            it.setCheckedBy(null);
            it.setCheckedAt(null);
        }
        preflightRepository.saveAll(items);

        recordRoomEvent(roomId, "DEMO_PREFLIGHT_RESET", roomId.toString(), user.getId());
    }

    private void seedPreflightDefaults(UUID roomId) {
        List<String> labels = new ArrayList<>();

        // Try parsing DEMO_SCRIPT.md
        try {
            Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
            if (docOpt.isPresent()) {
                Doc doc = docOpt.get();
                String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                        .map(DocVersion::getContent).orElse("");
                Pattern bulletPattern = Pattern.compile("(?m)^\\s*-\\s*\\[\\s*\\]\\s*(.+)$");
                Matcher m = bulletPattern.matcher(content);
                while (m.find()) {
                    String l = m.group(1).trim();
                    if (!l.isBlank() && !labels.contains(l)) {
                        labels.add(l);
                    }
                }
            }
        } catch (Exception ignored) {}

        if (labels.isEmpty()) {
            labels = List.of(
                    "Laptop charged to 100%",
                    "Spare laptop or device ready",
                    "Personal hotspot enabled and paired",
                    "Charger plugged in",
                    "Known-good test account verified",
                    "Wi-Fi off mode tested",
                    "Notifications and Do Not Disturb turned on",
                    "Volume and audio output checked",
                    "Browser tabs prepared and cleaned",
                    "Browser zoom reset to 100%"
            );
        }

        int pos = 0;
        for (String label : labels) {
            String hash = computeHash(label);
            if (preflightRepository.findByRoomIdAndItemHash(roomId, hash).isEmpty()) {
                preflightRepository.save(new DemoPreflight(roomId, hash, label, "DEFAULT", pos++));
            }
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────────

    private DemoStationDtos.DemoAssetDto toAssetDto(DemoAsset a) {
        return new DemoStationDtos.DemoAssetDto(
                a.getId(),
                a.getRoomId(),
                a.getKind(),
                a.getUrl(),
                a.getProvider(),
                a.getTitle(),
                a.getStatus(),
                a.getCheckedAt(),
                a.getCaption(),
                a.getPosition(),
                a.getAddedBy(),
                a.getCreatedAt()
        );
    }

    private Map<String, String> getUserNameMap(UUID roomId) {
        Map<String, String> map = new HashMap<>();
        try {
            var members = roomAccessService.getActiveRoomOrThrow(roomId);
            // query user display names
            userRepository.findAll().forEach(u -> {
                String name = u.getUsername() != null ? "@" + u.getUsername() : (u.getName() != null ? u.getName() : "teammate");
                map.put(u.getId().toString(), name);
            });
        } catch (Exception ignored) {}
        return map;
    }

    private String computeHash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.trim().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(16, digest.length); i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().substring(0, 16);
        }
    }

    private void recordRoomEvent(UUID roomId, String type, String entityId, UUID userId) {
        try {
            roomEventService.recordEvent(roomId, type, "DEMO_STATION", entityId, userId);
        } catch (Exception ex) {
            log.warn("Failed to record room event {}: {}", type, ex.getMessage());
        }
    }
}
