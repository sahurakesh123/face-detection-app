# Face Recognition System

A comprehensive face recognition system built with Java Spring Boot backend and Angular frontend that captures faces from various camera sources, matches them against a database, and sends notifications.

## Features

1. **Face Capture**: Live camera capture from browser, laptop camera, ATM camera, CCTV
2. **Face Matching**: Real-time face matching against database
3. **Notifications**: Email/SMS notifications when matches are found
4. **Location Tracking**: GPS coordinates capture with face detection
5. **User Registration**: Complete user registration and management system

## Technology Stack

### Backend (Java)
- Spring Boot 3.2.0
- Spring Security
- Spring Data JPA
- OpenCV (Java bindings)
- Face Recognition Library
- JavaMail API
- WebSocket for real-time communication

### Frontend (Angular)
- Angular 17
- Angular Material
- WebRTC for camera access
- Chart.js for analytics
- Socket.io for real-time updates

### Database
- PostgreSQL
- Redis for caching

## Project Structure

```
face-recognition-system/
├── backend/                 # Spring Boot application
├── frontend/               # Angular application
├── docker-compose.yml      # Docker configuration
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL
- Docker (optional)

### Backend Setup
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

### Docker Setup
```bash
docker-compose up -d
```

## API Documentation
- Backend API: http://localhost:8080/api
- Frontend: http://localhost:4200
- Swagger UI: http://localhost:8080/swagger-ui.html

## Configuration
See `backend/src/main/resources/application.yml` for database and email configuration.