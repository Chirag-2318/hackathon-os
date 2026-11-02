package com.hackathonos.backend.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class SmtpMailTransport implements MailTransport {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailTransport.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final MailProperties mailProperties;

    public SmtpMailTransport(ObjectProvider<JavaMailSender> mailSenderProvider, MailProperties mailProperties) {
        this.mailSenderProvider = mailSenderProvider;
        this.mailProperties = mailProperties;
    }

    @Override
    public void send(String to, String subject, String htmlBody, String textBody) throws Exception {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("JavaMailSender is not available in application context");
        }

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(mailProperties.getFromAddress(), mailProperties.getFromName());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(textBody != null ? textBody : "", htmlBody != null ? htmlBody : "");

        if (mailProperties.getReplyTo() != null && !mailProperties.getReplyTo().isBlank()) {
            helper.setReplyTo(mailProperties.getReplyTo());
        }
        mimeMessage.setHeader("Auto-Submitted", "auto-generated");

        mailSender.send(mimeMessage);
        log.info("[SMTP] Email successfully sent to {}", to);
    }

    @Override
    public String getProviderName() {
        return "smtp";
    }
}

