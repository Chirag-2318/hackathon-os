package com.hackathonos.backend.email;

/**
 * Common abstraction for outgoing email transport implementations.
 * Supported providers: SMTP, Resend (HTTP API), and Log (local/dev/testing).
 */
public interface MailTransport {
    void send(String to, String subject, String htmlBody, String textBody) throws Exception;
    String getProviderName();
}
