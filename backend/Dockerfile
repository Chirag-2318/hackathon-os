# Stage 1: Build
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /workspace

# Copy build configuration and wrapper for layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B || true

# Copy source and package runnable jar
COPY src/ src/
RUN ./mvnw -q -DskipTests package && \
    find target/ -maxdepth 1 -name "*.jar" ! -name "*original*" ! -name "*-plain.jar" -exec cp {} /workspace/app.jar \;

# Stage 2: Minimal Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

# Copy single runnable jar
COPY --from=builder --chown=appuser:appgroup /workspace/app.jar /app/app.jar

ENV PORT=10000
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65 -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
