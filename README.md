# Face Recognition System

A comprehensive face recognition system built with Java Spring Boot backend and Angular frontend that captures faces from various camera sources and matches them against a database.

## Features

1. **Face Capture**: Live camera capture from browser, laptop camera, ATM camera, CCTV
2. **Face Matching**: Real-time face matching against database
3. **Notifications**: Email/SMS notifications when matches are found
4. **Location Tracking**: GPS coordinates capture with face detection
5. **User Registration**: Complete user registration and management system

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- OpenCV (Java)
- Face Recognition Library
- JavaMail API
- PostgreSQL

### Frontend
- Angular 17
- Angular Material
- WebRTC for camera access
- Face-api.js for face detection
- Leaflet for maps

## Project Structure

```
face-recognition-system/
├── backend/                 # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/               # Angular application
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   └── environments/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 13+
- Maven 3.6+

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
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

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/faces/capture` - Capture and match face
- `GET /api/faces/matches` - Get face matches
- `POST /api/notifications/send` - Send notifications

## Environment Variables

Create `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=face_recognition
DB_USERNAME=postgres
DB_PASSWORD=password

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=86400000
```

## License

MIT License