package com.hackathonos.backend.billing;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
public class BillingController {

    private final BillingService billingService;
    private final CurrentUser currentUser;

    public record RecordInterestRequest(
            @NotBlank(message = "Plan is required")
            String plan,
            String note
    ) {}

    public record SimpleSuccessResponse(boolean success, String message) {}

    public BillingController(BillingService billingService, CurrentUser currentUser) {
        this.billingService = billingService;
        this.currentUser = currentUser;
    }

    @GetMapping({"/api/v1/billing", "/billing"})
    public BillingService.BillingSummaryResponse getBilling() {
        User user = currentUser.get();
        return billingService.getBillingSummary(user);
    }

    @PostMapping({"/api/v1/billing/interest", "/billing/interest"})
    public SimpleSuccessResponse recordInterest(@Valid @RequestBody RecordInterestRequest request) {
        User user = currentUser.get();
        billingService.recordInterest(user, request.plan(), request.note());
        return new SimpleSuccessResponse(true, "We've added you to the waitlist for the " + request.plan().toUpperCase() + " plan. We'll email you when paid plans open.");
    }
}
