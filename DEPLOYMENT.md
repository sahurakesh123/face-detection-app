# Face Recognition System - Deployment Guide

This document provides detailed instructions for deploying the Face Recognition System in various environments.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd face-recognition-system

# Run the setup script
./setup.sh

# Start the system
./start-all.sh
```

### Option 2: Docker Deployment

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Memory**: Minimum 4GB RAM, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for package downloads

### Software Dependencies

#### For Local Development
- **Java**: OpenJDK 17 or higher
- **Maven**: 3.6.0 or higher
- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **MySQL**: 8.0 or higher
- **Angular CLI**: Latest version

#### For Docker Deployment
- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

## Configuration

### Database Configuration

#### Option 1: MySQL Server

1. Install MySQL Server:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# macOS (using Homebrew)
brew install mysql
```

2. Create database:
```sql
CREATE DATABASE face_recognition_db;
CREATE USER 'faceuser'@'localhost' IDENTIFIED BY 'facepass123';
GRANT ALL PRIVILEGES ON face_recognition_db.* TO 'faceuser'@'localhost';
FLUSH PRIVILEGES;
```

#### Option 2: Docker MySQL

```bash
docker run -d \
  --name mysql-face-recognition \
  -e MYSQL_ROOT_PASSWORD=rootpass123 \
  -e MYSQL_DATABASE=face_recognition_db \
  -e MYSQL_USER=faceuser \
  -e MYSQL_PASSWORD=facepass123 \
  -p 3306:3306 \
  mysql:8.0
```

### Email Configuration

#### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password

3. Update configuration:
```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

#### Other Email Providers

```properties
# Outlook
spring.mail.host=smtp.office365.com
spring.mail.port=587

# Yahoo
spring.mail.host=smtp.mail.yahoo.com
spring.mail.port=587
```

### SMS Configuration (Twilio)

1. Create Twilio Account: https://www.twilio.com/
2. Get credentials from Twilio Console
3. Update configuration:
```properties
twilio.account.sid=your-account-sid
twilio.auth.token=your-auth-token
twilio.phone.number=your-twilio-number
```

## Deployment Options

### 1. Development Environment

```bash
# Start backend
cd backend
mvn spring-boot:run

# Start frontend (in new terminal)
cd frontend
ng serve
```

Access:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080/api

### 2. Production Environment

#### Using Systemd (Linux)

1. Create service files:

**Backend Service** (`/etc/systemd/system/face-recognition-backend.service`):
```ini
[Unit]
Description=Face Recognition Backend
After=mysql.service

[Service]
Type=forking
User=facerecognition
WorkingDirectory=/opt/face-recognition/backend
ExecStart=/usr/bin/java -jar target/face-recognition-backend-1.0.0.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Frontend Service** (`/etc/systemd/system/face-recognition-frontend.service`):
```ini
[Unit]
Description=Face Recognition Frontend
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=/opt/face-recognition/frontend
ExecStart=/usr/bin/ng serve --host 0.0.0.0 --port 4200
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start services:
```bash
sudo systemctl enable face-recognition-backend
sudo systemctl enable face-recognition-frontend
sudo systemctl start face-recognition-backend
sudo systemctl start face-recognition-frontend
```

#### Using Docker in Production

1. Create production Docker Compose:
```yaml
version: '3.8'
services:
  # ... (same as docker-compose.yml but with production settings)
  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=production
```

2. Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Cloud Deployment

#### AWS Deployment

1. **EC2 Instance**:
   - Launch Ubuntu 20.04 LTS instance
   - Security group: ports 22, 80, 443, 8080, 4200
   - Elastic IP for static address

2. **RDS MySQL**:
   - Create MySQL RDS instance
   - Update connection string in application.properties

3. **S3 for File Storage**:
   - Create S3 bucket for face images
   - Configure IAM roles

#### Google Cloud Platform

1. **Compute Engine**:
   - Create VM instance
   - Install Docker and Docker Compose

2. **Cloud SQL**:
   - Create MySQL instance
   - Configure networking

#### Azure Deployment

1. **Virtual Machine**:
   - Create Linux VM
   - Configure Network Security Group

2. **Azure Database for MySQL**:
   - Create MySQL server
   - Configure firewall rules

### 4. Kubernetes Deployment

```yaml
# kubernetes/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: face-recognition

---
# kubernetes/mysql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: face-recognition
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "rootpass123"
        - name: MYSQL_DATABASE
          value: "face_recognition_db"
        ports:
        - containerPort: 3306
```

Deploy to Kubernetes:
```bash
kubectl apply -f kubernetes/
```

## Security Considerations

### SSL/TLS Configuration

#### Using Let's Encrypt with Nginx

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

#### Using Docker with SSL

```yaml
# docker-compose.ssl.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### Firewall Configuration

```bash
# Ubuntu UFW
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 8080    # Backend API
sudo ufw enable
```

### Database Security

1. **Change default passwords**
2. **Enable SSL connections**
3. **Regular backups**
4. **Limit network access**

## Monitoring and Logging

### Application Logs

Logs are available at:
- Backend: `backend/logs/application.log`
- Frontend: Browser console and server logs

### Health Checks

- Backend: `GET /api/actuator/health`
- Frontend: `GET /health`

### Monitoring Setup

#### Prometheus + Grafana

```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
mysqldump -u root -p face_recognition_db > backup.sql

# Restore from backup
mysql -u root -p face_recognition_db < backup.sql
```

### File Backup

```bash
# Backup uploaded files
tar -czf face-images-backup.tar.gz uploads/faces/
```

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/face-recognition"

# Database backup
mysqldump -u root -p face_recognition_db > $BACKUP_DIR/db_backup_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz uploads/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

#### Backend Won't Start

1. **Check Java version**:
```bash
java -version
```

2. **Check MySQL connection**:
```bash
mysql -u faceuser -p -h localhost face_recognition_db
```

3. **Check logs**:
```bash
tail -f backend/logs/application.log
```

#### Frontend Won't Load

1. **Check Node.js version**:
```bash
node --version
npm --version
```

2. **Clear cache**:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

#### Camera Not Working

1. **Browser permissions**: Allow camera access
2. **HTTPS requirement**: Camera requires HTTPS in production
3. **Firewall**: Check if ports are blocked

### Performance Tuning

#### Backend Optimization

```properties
# application.properties
server.tomcat.max-threads=200
spring.datasource.hikari.maximum-pool-size=20
spring.jpa.hibernate.jdbc.batch_size=20
```

#### Frontend Optimization

```bash
# Build with optimization
ng build --prod --aot --build-optimizer
```

#### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_person_email ON persons(email);
CREATE INDEX idx_detection_time ON detection_logs(detection_time);
CREATE INDEX idx_face_person ON face_data(person_id);
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Update dependencies** (monthly)
2. **Database cleanup** (weekly)
3. **Log rotation** (daily)
4. **Security updates** (as needed)

### Monitoring Checklist

- [ ] Application is responding
- [ ] Database is accessible
- [ ] Disk space is sufficient
- [ ] Memory usage is normal
- [ ] Email notifications working
- [ ] SMS notifications working
- [ ] Camera access functioning

For additional support, please refer to the main README.md or create an issue in the project repository.