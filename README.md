# Face Recognition System

A comprehensive Java Spring Boot + Angular application for real-time face recognition with database matching and notification features.

## Features

1. **Live Camera Face Capture** - Works with browser, laptop, ATM, and CCTV cameras
2. **Face Matching** - Real-time face detection and matching against database
3. **Notification System** - Email and SMS alerts for matched faces
4. **Location Tracking** - GPS coordinates included in notifications
5. **Registration Portal** - User-friendly registration interface

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- Spring Security
- MySQL Database
- OpenCV for Java (face recognition)
- JavaMail API (email notifications)
- Twilio API (SMS notifications)

### Frontend
- Angular 17
- TypeScript
- Bootstrap 5
- WebRTC API (camera access)
- Angular Material

## Project Structure

```
face-recognition-system/
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   └── com/facerecognition/
│   │       ├── controller/   # REST controllers
│   │       ├── service/      # Business logic
│   │       ├── repository/   # Data access layer
│   │       ├── model/        # Entity models
│   │       ├── config/       # Configuration classes
│   │       └── util/         # Utility classes
│   └── src/main/resources/
├── frontend/                # Angular application
│   ├── src/app/
│   │   ├── components/      # Angular components
│   │   ├── services/        # Angular services
│   │   ├── models/          # TypeScript models
│   │   └── guards/          # Route guards
└── docs/                    # Documentation
```

## Setup Instructions

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.6+
- Angular CLI

### Backend Setup
1. Navigate to backend directory
2. Configure database in `application.properties`
3. Run `mvn clean install`
4. Start with `mvn spring-boot:run`

### Frontend Setup
1. Navigate to frontend directory
2. Run `npm install`
3. Start with `ng serve`

### Database Setup
- Create MySQL database `face_recognition_db`
- Tables will be auto-created on first run

## API Endpoints

- `POST /api/register` - Register new person
- `POST /api/face/detect` - Detect and match face
- `GET /api/persons` - Get all registered persons
- `POST /api/notifications/email` - Send email notification
- `POST /api/notifications/sms` - Send SMS notification

## Configuration

### Email Configuration (application.properties)
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### Twilio Configuration
```properties
twilio.account.sid=your-account-sid
twilio.auth.token=your-auth-token
twilio.phone.number=your-twilio-number
```

## Security Features

- CORS configuration for camera access
- Input validation and sanitization
- Secure file upload handling
- Rate limiting for API endpoints

## License

This project is licensed under the MIT License.