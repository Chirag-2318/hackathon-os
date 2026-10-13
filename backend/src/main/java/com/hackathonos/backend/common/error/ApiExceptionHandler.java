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
        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.CONFLICT.value(),
                "DOC_CHANGED",
                ex.getMessage(),
                reqId
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(EntityConflictException.class)
    public ResponseEntity<ErrorResponse> handleEntityConflict(EntityConflictException ex) {
        String reqId = resolveRequestId();
        Map<String, Object> details = new HashMap<>();
        details.put("currentVersion", ex.getCurrentVersion());
        details.put("lastEditedBy", ex.getLastEditedBy());
        details.put("updatedAt", ex.getUpdatedAt());

        ErrorResponse body = new ErrorResponse(
                ex.getCode() != null ? ex.getCode() : ErrorCode.VERSION_CONFLICT.getCode(),
                ex.getMessage(),
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        String reqId = resolveRequestId();
        log.error("Internal error [{}]", reqId, ex);
        ErrorResponse body = new ErrorResponse(
                ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                "An unexpected internal error occurred. Please try again later.",
                null,
                reqId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

