package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;

/**
 * Resolves OAuth2 authorization requests, explicitly building redirect URIs
 * from API_PUBLIC_URL (/login/oauth2/code/{registrationId}) rather than guessing from request headers.
 */
public class ExplicitRedirectUriOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;
    private final AppProperties appProperties;

    public ExplicitRedirectUriOAuth2AuthorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository,
            AppProperties appProperties
    ) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                "/oauth2/authorization"
        );
        this.appProperties = appProperties;
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        return customize(req);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customize(req);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest req) {
        if (req == null) {
            return null;
        }
        String publicUrl = appProperties.getPublicUrl();
        if (publicUrl != null && !publicUrl.isBlank()) {
            String baseUrl = publicUrl.replaceAll("/+$", "");
            String regId = (String) req.getAttributes().get(OAuth2ParameterNames.REGISTRATION_ID);
            if (regId != null && !regId.isBlank()) {
                String explicitRedirectUri = baseUrl + "/login/oauth2/code/" + regId;
                return OAuth2AuthorizationRequest.from(req)
                        .redirectUri(explicitRedirectUri)
                        .build();
            }
        }
        return req;
    }
}
