package com.hackathonos.backend.mcp.oauth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record OAuthRegisterRequest(
        @JsonProperty("client_name") String clientName,
        @JsonProperty("redirect_uris") List<String> redirectUris,
        @JsonProperty("grant_types") List<String> grantTypes,
        @JsonProperty("response_types") List<String> responseTypes,
        @JsonProperty("token_endpoint_auth_method") String tokenEndpointAuthMethod
) {}
