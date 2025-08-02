FROM openjdk:17-jdk-slim

# Install OpenCV dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    libopencv-contrib-dev \
    libopencv-core-dev \
    libopencv-imgproc-dev \
    libopencv-objdetect-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make mvnw executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Create models directory
RUN mkdir -p /app/models

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/face-recognition-backend-1.0.0.jar"]