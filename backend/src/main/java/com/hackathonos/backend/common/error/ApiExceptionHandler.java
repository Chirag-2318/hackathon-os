package com.hackathonos.backend.common.error;

import com.hackathonos.backend.common.http.RequestIdFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Global exception handler providing uniform error responses across all controllers.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    private final com.hackathonos.backend.common.observability.SentryService sentryService;

    public ApiExceptionHandler() {
        this(new com.hackathonos.backend.common.observability.SentryService(""));
    }

    public ApiExceptionHandler(com.hackathonos.backend.common.observability.SentryService sentryService) {
        this.sentryService = sentryService != null ? sentryService : new com.hackathonos.backend.common.observability.SentryService("");
    }

    private String resolveRequestId() {
        String reqId = MDC.get(RequestIdFilter.MDC_KEY);
        if (reqId == null || reqId.isBlank()) {
            reqId = UUID.randomUUID().toString();
        }
        return reqId;
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.NOT_FOUND.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthenticated(UnauthenticatedException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.UNAUTHORIZED.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AccountDeletedException.class)
    public ResponseEntity<ErrorResponse> handleAccountDeleted(AccountDeletedException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.UNAUTHORIZED.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.FORBIDDEN.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(LimitReachedException.class)
    public ResponseEntity<ErrorResponse> handleLimitReached(LimitReachedException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.BAD_REQUEST.value(),
                ex.getCode() != null ? ex.getCode() : "LIMIT_REACHED",
                ex.getMessage(),
                reqId,
                null,
                null
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.BAD_REQUEST.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId,
                ex.getFieldErrors().isEmpty() ? null : ex.getFieldErrors(),
                ex.getDetails().isEmpty() ? null : ex.getDetails()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.CONFLICT.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId,
                null,
                ex.getDetails().isEmpty() ? null : ex.getDetails()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(com.hackathonos.backend.tasks.TaskConflictException.class)
    public ResponseEntity<ErrorResponse> handleTaskConflict(com.hackathonos.backend.tasks.TaskConflictException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.CONFLICT.value(),
                "TASK_CHANGED",
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(com.hackathonos.backend.docs.DocConflictException.class)
    public ResponseEntity<ErrorResponse> handleDocConflict(com.hackathonos.backend.docs.DocConflictException ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        details.put("code", "EDIT_CONFLICT");
        details.put("currentVersion", ex.getVersion());
        details.put("version", ex.getVersion());
        details.put("content", ex.getContent());
        details.put("currentContent", ex.getContent());
        details.put("editorName", ex.getLastEditorName());
        details.put("lastEditorName", ex.getLastEditorName());
        details.put("updatedAt", ex.getUpdatedAt());
        Map<String, Object> currentCopy = new HashMap<>();
        currentCopy.put("content", ex.getContent());
        currentCopy.put("version", ex.getVersion());
        currentCopy.put("lastEditorName", ex.getLastEditorName());
        currentCopy.put("updatedAt", ex.getUpdatedAt());
        details.put("currentCopy", currentCopy);
        details.put("latestData", currentCopy);

        ErrorResponse body = new ErrorResponse(
                "EDIT_CONFLICT",
                ex.getMessage(),
                details,
                reqId
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(EntityConflictException.class)
    public ResponseEntity<ErrorResponse> handleEntityConflict(EntityConflictException ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        details.put("code", "EDIT_CONFLICT");
        details.put("currentVersion", ex.getCurrentVersion());
        details.put("version", ex.getCurrentVersion());
        details.put("lastEditedBy", ex.getLastEditedBy());
        String editorName = ex.getEditorName() != null ? ex.getEditorName()
                : (ex.getLastEditedBy() != null ? ex.getLastEditedBy().displayName() : null);
        details.put("editorName", editorName);
        details.put("lastEditorName", editorName);
        details.put("updatedAt", ex.getUpdatedAt());
        if (ex.getLatestData() != null) {
            details.put("latestData", ex.getLatestData());
            details.put("currentCopy", ex.getLatestData());
        }

        ErrorResponse body = new ErrorResponse(
                "EDIT_CONFLICT",
                ex.getMessage(),
                details,
                reqId
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler({
            org.springframework.dao.OptimisticLockingFailureException.class,
            jakarta.persistence.OptimisticLockException.class
    })
    public ResponseEntity<ErrorResponse> handleOptimisticLockingFailure(Exception ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        details.put("code", "EDIT_CONFLICT");
        details.put("message", "This resource was modified by another teammate. Please refresh and try again.");
        ErrorResponse body = new ErrorResponse(
                "EDIT_CONFLICT",
                "This resource was modified by another teammate. Please refresh and try again.",
                details,
                reqId
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ErrorResponse> handleTooManyRequests(TooManyRequestsException ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        if (ex.getRetryAfterSeconds() > 0) {
            details.put("retryAfterSeconds", ex.getRetryAfterSeconds());
        }
        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : ErrorCode.TOO_MANY_REQUESTS.getCode(),
                ex.getMessage(),
                details.isEmpty() ? null : details,
                reqId
        );
        var builder = ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS);
        if (ex.getRetryAfterSeconds() > 0) {
            builder.header(org.springframework.http.HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()));
        }
        return builder.body(body);
    }

@ExceptionHandler(ServerBusyException.class)
    public ResponseEntity<ErrorResponse> handleServerBusy(ServerBusyException ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        if (ex.getRetryAfterSeconds() > 0) {
            details.put("retryAfterSeconds", ex.getRetryAfterSeconds());
        }
        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : "SERVER_BUSY",
                ex.getMessage(),
                details.isEmpty() ? null : details,
                reqId,
                Instant.now().toString(),
                HttpStatus.SERVICE_UNAVAILABLE.value()
        );
        var builder = ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE);
        if (ex.getRetryAfterSeconds() > 0) {
            builder.header(org.springframework.http.HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()));
        }
        return builder.body(body);
    }

    @ExceptionHandler(AiOutputException.class)
    public ResponseEntity<ErrorResponse> handleAiOutput(AiOutputException ex) {
        String reqId = resolveRequestId();
        String code = ex.getCode();
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        if ("AI_RESTRICTED_BY_EVENT".equalsIgnoreCase(code)) {
            status = HttpStatus.FORBIDDEN;
            code = "AI_RESTRICTED_BY_EVENT";
        } else if ("AI_CIRCUIT_OPEN".equalsIgnoreCase(code) || "AI_UNAVAILABLE".equalsIgnoreCase(code)) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            code = "AI_UNAVAILABLE";
        } else if (code == null || code.isBlank() || "AI_OUTPUT_ERROR".equalsIgnoreCase(code)) {
            code = "AI_OUTPUT_INVALID";
        }

        ErrorResponse body = new ErrorResponse(
                code,
                ex.getMessage(),
                null,
                reqId
        );
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(AiKeyMissingException.class)
    public ResponseEntity<ErrorResponse> handleAiKeyMissing(AiKeyMissingException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : ErrorCode.AI_KEY_MISSING.getCode(),
                ex.getMessage(),
                null,
                reqId
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(AiKeyInvalidException.class)
    public ResponseEntity<ErrorResponse> handleAiKeyInvalid(AiKeyInvalidException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : ErrorCode.AI_KEY_INVALID.getCode(),
                ex.getMessage(),
                null,
                reqId
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AiKeyRateLimitedException.class)
    public ResponseEntity<ErrorResponse> handleAiKeyRateLimited(AiKeyRateLimitedException ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        if (ex.getRetryAfterSeconds() > 0) {
            details.put("retryAfterSeconds", ex.getRetryAfterSeconds());
        }
        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : ErrorCode.AI_KEY_RATE_LIMITED.getCode(),
                ex.getMessage(),
                details,
                reqId
        );
        var builder = ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS);
        if (ex.getRetryAfterSeconds() > 0) {
            builder.header(org.springframework.http.HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()));
        }
        return builder.body(body);
    }

    @ExceptionHandler(BadGatewayException.class)

    public ResponseEntity<ErrorResponse> handleBadGateway(BadGatewayException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : "BAD_GATEWAY",
                ex.getMessage(),
                null,
                reqId
        );
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
    }

    @ExceptionHandler(UnprocessableEntityException.class)
    public ResponseEntity<ErrorResponse> handleUnprocessableEntity(UnprocessableEntityException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(PayloadTooLargeException.class)
    public ResponseEntity<ErrorResponse> handlePayloadTooLarge(PayloadTooLargeException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(FileExtractionException.class)
    public ResponseEntity<ErrorResponse> handleFileExtraction(FileExtractionException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                ex.getStatus().value(),
                ex.getCode(),
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                "FILE_TOO_LARGE",
                "Uploaded file exceeds the maximum allowed size (12MB limit).",
                reqId
        );
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String reqId = resolveRequestId();
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_FAILED",
                "Invalid request payload",
                reqId,
                errors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String reqId = resolveRequestId();
        // If type mismatch is on a path variable (e.g. invalid UUID in room path), return 404 NOT_FOUND
        if (ex.getParameter() != null && ex.getParameter().hasParameterAnnotation(PathVariable.class)) {
            ErrorResponse body = new ErrorResponse(
                    Instant.now().toString(),
                    HttpStatus.NOT_FOUND.value(),
                    "NOT_FOUND",
                    "Not found",
                    reqId
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }

        // Query parameters get 400 BAD_REQUEST with field error naming the parameter
        Map<String, String> fieldErrors = new HashMap<>();
        fieldErrors.put(ex.getName(), "Invalid parameter value");
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.BAD_REQUEST.value(),
                "INVALID_PARAMETER",
                "Invalid parameter: " + ex.getName(),
                reqId,
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.NOT_FOUND.value(),
                "NOT_FOUND",
                "Not found",
                reqId
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String reqId = resolveRequestId();
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "METHOD_NOT_ALLOWED",
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    @ExceptionHandler({org.springframework.dao.DataAccessException.class, java.sql.SQLException.class})
    public ResponseEntity<ErrorResponse> handleDatabaseError(Exception ex) {
        String reqId = resolveRequestId();
        log.error("Database error [{}]", reqId, ex);
        sentryService.captureException(ex, reqId, Map.of("handler", "handleDatabaseError"));
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                "A database error occurred. Please try again later.",
                reqId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        String reqId = resolveRequestId();
        log.error("Internal error [{}]", reqId, ex);
        sentryService.captureException(ex, reqId, Map.of("handler", "handleGeneric"));
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                "An unexpected internal error occurred. Please try again later.",
                reqId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

