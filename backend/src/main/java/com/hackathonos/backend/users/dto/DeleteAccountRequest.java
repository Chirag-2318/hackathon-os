package com.hackathonos.backend.users.dto;

public record DeleteAccountRequest(
        String confirmUsername,
        Boolean autoTransferLeadership,
        String confirm
) {
    public DeleteAccountRequest(String confirmUsername, Boolean autoTransferLeadership) {
        this(confirmUsername, autoTransferLeadership, null);
    }

    public DeleteAccountRequest(String confirm) {
        this(confirm, false, confirm);
    }
}
