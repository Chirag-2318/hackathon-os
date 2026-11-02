package com.hackathonos.backend.mcp.oauth;

public class OAuthExceptions {

    private OAuthExceptions() {}

    /**
     * Thrown when client_id or redirect_uri validation fails.
     * MUST render an error page and NEVER redirect back to the client.
     */
    public static class TerminalException extends RuntimeException {
        private final String error;
        private final String description;

        public TerminalException(String error, String description) {
            super(description);
            this.error = error;
            this.description = description;
        }

        public String getError() { return error; }
        public String getDescription() { return description; }
    }

    /**
     * Thrown when parameter validation fails AFTER client_id and redirect_uri are validated.
     * Redirects back to the client with error and state.
     */
    public static class RedirectException extends RuntimeException {
        private final String redirectUri;
        private final String state;
        private final String error;
        private final String description;

        public RedirectException(String redirectUri, String state, String error, String description) {
            super(description);
            this.redirectUri = redirectUri;
            this.state = state;
            this.error = error;
            this.description = description;
        }

        public String getRedirectUri() { return redirectUri; }
        public String getState() { return state; }
        public String getError() { return error; }
        public String getDescription() { return description; }
    }

    /**
     * Thrown for RFC 6749 token endpoint errors.
     */
    public static class TokenException extends RuntimeException {
        private final int httpStatus;
        private final String error;
        private final String description;

        public TokenException(int httpStatus, String error, String description) {
            super(description);
            this.httpStatus = httpStatus;
            this.error = error;
            this.description = description;
        }

        public int getHttpStatus() { return httpStatus; }
        public String getError() { return error; }
        public String getDescription() { return description; }
    }
}
