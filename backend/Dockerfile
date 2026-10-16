# Multi-stage multi-arch Dockerfile for amd64 and arm64 (Oracle Ampere)

# Stage 1: Build JAR
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /workspace

# Cache Maven dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Compile and package application
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal Production Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Install curl/wget for healthchecks and configure non-root security context
RUN apk add --no-cache curl wget && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/uploads /app/config && chown -R appuser:appgroup /app

USER appuser

# Copy built artifact
COPY --from=builder --chown=appuser:appgroup /workspace/target/*.jar app.jar

ENV SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    TZ=UTC

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=35s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health/readiness | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=60", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Duser.timezone=UTC", \
  "-jar", "app.jar"]
