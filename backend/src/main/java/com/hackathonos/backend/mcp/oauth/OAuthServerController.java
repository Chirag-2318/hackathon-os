package com.hackathonos.backend.mcp.oauth;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.mcp.McpService;
import com.hackathonos.backend.mcp.oauth.dto.*;
import com.hackathonos.backend.users.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
public class OAuthServerController {

    public static final String SESSION_AUTH_REQ = "OAUTH_AUTHORIZE_REQUEST";

    private final OAuthServerService oAuthServerService;
    private final McpService mcpService;
    private final CurrentUser currentUser;
    private final AppProperties appProperties;

    public record AuthorizeSessionData(
            String clientId,
            String redirectUri,
            String state,
            String codeChallenge,
            String scope,
            String resource
    ) implements java.io.Serializable {}

    public OAuthServerController(
            OAuthServerService oAuthServerService,
            McpService mcpService,
            CurrentUser currentUser,
            AppProperties appProperties
    ) {
        this.oAuthServerService = oAuthServerService;
        this.mcpService = mcpService;
        this.currentUser = currentUser;
        this.appProperties = appProperties;
    }

    @GetMapping("/.well-known/oauth-authorization-server")
    public ResponseEntity<OAuthDiscoveryResponse> getDiscovery() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(oAuthServerService.getDiscoveryMetadata());
    }

    @PostMapping(value = "/oauth/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<OAuthRegisterResponse> register(
            @RequestBody OAuthRegisterRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getHeader(appProperties.getClientIpHeader());
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = servletRequest.getRemoteAddr();
        }
        OAuthRegisterResponse response = oAuthServerService.registerClient(request, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/oauth/authorize")
    public ResponseEntity<String> authorize(
            @RequestParam(name = "client_id", required = false) String clientId,
            @RequestParam(name = "redirect_uri", required = false) String redirectUri,
            @RequestParam(name = "response_type", required = false) String responseType,
            @RequestParam(name = "code_challenge", required = false) String codeChallenge,
            @RequestParam(name = "code_challenge_method", required = false) String codeChallengeMethod,
            @RequestParam(name = "scope", required = false) String scope,
            @RequestParam(name = "resource", required = false) String resource,
            @RequestParam(name = "state", required = false) String state,
            HttpServletRequest request,
            HttpSession session
    ) {
        OAuthClient client;
        try {
            client = oAuthServerService.validateClientAndRedirectUri(clientId, redirectUri);
        } catch (OAuthExceptions.TerminalException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.TEXT_HTML)
                    .headers(getAntiFramingHeaders())
                    .body(OAuthViews.renderErrorPage(ex.getError(), ex.getDescription()));
        }

        try {
            oAuthServerService.validateAuthorizeParameters(client, redirectUri, state,
                    responseType, codeChallenge, codeChallengeMethod, scope, resource);
        } catch (OAuthExceptions.RedirectException ex) {
            String redirect = buildRedirectError(ex.getRedirectUri(), ex.getError(), ex.getDescription(), ex.getState());
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, redirect)
                    .build();
        }

        User user = currentUser.get();
        if (!mcpService.isPlanAllowed(user)) {
            String upgradeUrl = appProperties.getPublicUrl() + "/app/settings?tab=billing";
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .headers(getAntiFramingHeaders())
                    .body(OAuthViews.renderUpgradePage(upgradeUrl));
        }

        session.setAttribute(SESSION_AUTH_REQ, new AuthorizeSessionData(
                clientId, redirectUri, state, codeChallenge, scope, resource
        ));

        String hostname = extractHostname(redirectUri);
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        String tokenVal = csrfToken != null ? csrfToken.getToken() : "";

        String html = OAuthViews.renderConsentPage(client.getClientName(), hostname, tokenVal);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .headers(getAntiFramingHeaders())
                .body(html);
    }

    @PostMapping("/oauth/authorize/decision")
    public ResponseEntity<Void> authorizeDecision(
            @RequestParam("decision") String decision,
            HttpSession session
    ) {
        AuthorizeSessionData authReq = (AuthorizeSessionData) session.getAttribute(SESSION_AUTH_REQ);
        if (authReq == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        session.removeAttribute(SESSION_AUTH_REQ);

        if (!"allow".equalsIgnoreCase(decision)) {
            String redirect = buildRedirectError(authReq.redirectUri(), "access_denied", "User denied access", authReq.state());
            return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, redirect).build();
        }

        User user = currentUser.get();
        if (!mcpService.isPlanAllowed(user)) {
            String redirect = buildRedirectError(authReq.redirectUri(), "access_denied", "MCP requires a Pro or Max plan", authReq.state());
            return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, redirect).build();
        }

        String rawCode = oAuthServerService.createAuthorizationCode(
                authReq.clientId(), user.getId(), authReq.redirectUri(),
                authReq.codeChallenge(), authReq.scope(), authReq.resource()
        );

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(authReq.redirectUri())
                .queryParam("code", rawCode);
        if (authReq.state() != null && !authReq.state().isBlank()) {
            builder.queryParam("state", authReq.state());
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, builder.build().encode().toUriString())
                .build();
    }

    @PostMapping(value = "/oauth/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<OAuthTokenResponse> token(@RequestParam MultiValueMap<String, String> form) {
        OAuthTokenResponse response = oAuthServerService.exchangeToken(form);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("Pragma", "no-cache")
                .body(response);
    }

    @PostMapping(value = "/oauth/token", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<OAuthErrorResponse> rejectJsonToken() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("Pragma", "no-cache")
                .body(new OAuthErrorResponse("invalid_request", "Requests must use application/x-www-form-urlencoded"));
    }

    @PostMapping(value = "/oauth/revoke", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Void> revoke(
            @RequestParam("token") String token,
            @RequestParam(name = "token_type_hint", required = false) String tokenTypeHint
    ) {
        oAuthServerService.revokeToken(token, tokenTypeHint);
        return ResponseEntity.ok().build();
    }

    @ExceptionHandler(OAuthExceptions.TokenException.class)
    public ResponseEntity<OAuthErrorResponse> handleTokenException(OAuthExceptions.TokenException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("Pragma", "no-cache")
                .body(new OAuthErrorResponse(ex.getError(), ex.getDescription()));
    }

    private HttpHeaders getAntiFramingHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Frame-Options", "DENY");
        headers.set("Content-Security-Policy", "frame-ancestors 'none'");
        return headers;
    }

    private String buildRedirectError(String redirectUri, String error, String description, String state) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("error", error);
        if (description != null && !description.isBlank()) {
            builder.queryParam("error_description", description);
        }
        if (state != null && !state.isBlank()) {
            builder.queryParam("state", state);
        }
        return builder.build().encode().toUriString();
    }

    private String extractHostname(String uriStr) {
        try {
            URI uri = URI.create(uriStr);
            if (uri.getPort() != -1 && uri.getPort() != 80 && uri.getPort() != 443) {
                return uri.getHost() + ":" + uri.getPort();
            }
            return uri.getHost() != null ? uri.getHost() : uriStr;
        } catch (Exception e) {
            return uriStr;
        }
    }
}
