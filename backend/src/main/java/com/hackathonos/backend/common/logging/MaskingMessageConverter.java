package com.hackathonos.backend.common.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

/**
 * Logback MessageConverter that redacts Groq keys and Authorization headers from all log lines.
 */
public class MaskingMessageConverter extends MessageConverter {

    @Override
    public String convert(ILoggingEvent event) {
        return MaskingUtils.mask(super.convert(event));
    }
}
