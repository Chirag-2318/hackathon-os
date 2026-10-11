package com.hackathonos.backend.common.error;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApiExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestExceptionController())
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    record ValidatedPayload(@NotBlank String name) {}

    @RestController
    @RequestMapping("/test/errors")
    static class TestExceptionController {

        @GetMapping("/not-found")
        public void throwNotFound() {
            throw new NotFoundException("NOT_FOUND", "Resource missing");
        }

        @GetMapping("/forbidden")
        public void throwForbidden() {
            throw new ForbiddenException("FORBIDDEN", "Access denied");
        }

        @GetMapping("/bad-request")
        public void throwBadRequest() {
            throw new BadRequestException("INVALID_INPUT", "Malformed input");
        }

        @GetMapping("/conflict")
        public void throwConflict() {
            throw new ConflictException("CONFLICT", "Resource already exists");
        }

        @GetMapping("/rate-limit")
        public void throwRateLimit() {
            throw new TooManyRequestsException("RATE_LIMITED", "Too many requests");
        }

        @GetMapping("/bad-gateway")
        public void throwBadGateway() {
            throw new BadGatewayException("BAD_GATEWAY", "Upstream unavailable");
        }

        @GetMapping("/unprocessable")
        public void throwUnprocessable() {
            throw new UnprocessableEntityException("UNPROCESSABLE", "Cannot process entity");
        }

        @GetMapping("/payload-too-large")
        public void throwPayloadTooLarge() {
            throw new PayloadTooLargeException("PAYLOAD_TOO_LARGE", "File exceeds limit");
        }

        @GetMapping("/unauthenticated")
        public void throwUnauthenticated() {
            throw new UnauthenticatedException("UNAUTHENTICATED", "Authentication required");
        }

        @GetMapping("/account-deleted")
        public void throwAccountDeleted() {
            throw new AccountDeletedException("ACCOUNT_DELETED", "Account has been deleted");
        }

        @GetMapping("/runtime")
        public void throwRuntime() {
            throw new RuntimeException("Unexpected boom");
        }

        @GetMapping("/path-variable/{id}")
        public String pathVariable(@PathVariable UUID id) {
            return id.toString();
        }

        @GetMapping("/query-param")
        public String queryParam(@RequestParam int number) {
            return String.valueOf(number);
        }

        @PostMapping("/validation")
        public String validate(@Valid @RequestBody ValidatedPayload payload) {
            return payload.name();
        }
    }

    @Test
    @DisplayName("NotFoundException maps to 404 with requestId")
    void testNotFound() throws Exception {
        mockMvc.perform(get("/test/errors/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()))
                .andExpect(jsonPath("$.timestamp").value(notNullValue()));
    }

    @Test
    @DisplayName("ForbiddenException maps to 403 with requestId")
    void testForbidden() throws Exception {
        mockMvc.perform(get("/test/errors/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("BadRequestException maps to 400 with requestId")
    void testBadRequest() throws Exception {
        mockMvc.perform(get("/test/errors/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_INPUT"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("ConflictException maps to 409 with requestId")
    void testConflict() throws Exception {
        mockMvc.perform(get("/test/errors/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("TooManyRequestsException maps to 429 with requestId")
    void testRateLimit() throws Exception {
        mockMvc.perform(get("/test/errors/rate-limit"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("BadGatewayException maps to 502 with requestId")
    void testBadGateway() throws Exception {
        mockMvc.perform(get("/test/errors/bad-gateway"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("BAD_GATEWAY"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("UnauthenticatedException maps to 401 UNAUTHENTICATED")
    void testUnauthenticated() throws Exception {
        mockMvc.perform(get("/test/errors/unauthenticated"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("AccountDeletedException maps to 401 ACCOUNT_DELETED")
    void testAccountDeleted() throws Exception {
        mockMvc.perform(get("/test/errors/account-deleted"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ACCOUNT_DELETED"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("Generic RuntimeException maps to 500 INTERNAL_ERROR with requestId")
    void testGenericException() throws Exception {
        mockMvc.perform(get("/test/errors/runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("Something went wrong"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("Type mismatch on PathVariable maps to 404 NOT_FOUND")
    void testPathVariableMismatch() throws Exception {
        mockMvc.perform(get("/test/errors/path-variable/invalid-uuid"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("Type mismatch on query parameter maps to 400 INVALID_PARAMETER")
    void testQueryParamMismatch() throws Exception {
        mockMvc.perform(get("/test/errors/query-param").param("number", "not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }

    @Test
    @DisplayName("MethodArgumentNotValidException maps to 400 VALIDATION_FAILED with fieldErrors")
    void testValidationFailure() throws Exception {
        mockMvc.perform(post("/test/errors/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.name").value(notNullValue()))
                .andExpect(jsonPath("$.requestId").value(notNullValue()));
    }
}
