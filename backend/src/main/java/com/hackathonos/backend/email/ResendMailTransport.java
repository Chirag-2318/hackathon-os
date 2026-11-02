package com.hackathonos.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ResendMailTransport implements MailTransport {

    private static final Logger log = LoggerFactory.getLogger(ResendMailTransport.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final MailProperties mailProperties;
    private final RestClient restClient;

    public ResendMailTransport(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public void send(String to, String subject, String htmlBody, String textBody) throws Exception {
        String apiKey = mailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY is not configured for ResendMailTransport");
        }

        String from = mailProperties.getFromName() + " <" + mailProperties.getFromAddress() + ">";

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", from);
        payload.put("to", List.of(to));
        payload.put("subject", subject);
        if (htmlBody != null && !htmlBody.isBlank()) {
            payload.put("html", htmlBody);
        }
        if (textBody != null && !textBody.isBlank()) {
            payload.put("text", textBody);
        }
        if (mailProperties.getReplyTo() != null && !mailProperties.getReplyTo().isBlank()) {
            payload.put("reply_to", mailProperties.getReplyTo());
        }

        ResponseEntity<String> response = restClient.post()
                .uri(RESEND_API_URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toEntity(String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Resend API rejected message with HTTP " + response.getStatusCode() + ": " + response.getBody());
        }

        log.info("[RESEND] Email successfully sent to {}", to);
    }

    @Override
    public String getProviderName() {
        return "resend";
    }
}

