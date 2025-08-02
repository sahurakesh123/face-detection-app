#!/bin/bash

echo "🚀 Setting up Face Recognition System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads/faces
mkdir -p models
mkdir -p nginx/ssl

# Download OpenCV models (if not exists)
echo "📥 Downloading OpenCV models..."
if [ ! -f "models/haarcascade_frontalface_default.xml" ]; then
    curl -L -o models/haarcascade_frontalface_default.xml \
        https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml
fi

# Create .env file for environment variables
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
# Database Configuration
POSTGRES_DB=face_recognition_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Email Configuration (Update these with your email settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT Configuration
JWT_SECRET=your-secret-key-here-make-it-long-and-secure
JWT_EXPIRATION=86400000

# Face Recognition Configuration
FACE_RECOGNITION_THRESHOLD=0.6
EOF

echo "⚠️  Please update the .env file with your email configuration before starting the application."

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

echo "✅ Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your email configuration"
echo "2. Access the application at http://localhost"
echo "3. Register a new user account"
echo "4. Register your face for detection"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop application: docker-compose down"
echo "  - Restart application: docker-compose restart"
echo ""
echo "🌐 Application URLs:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:8080/api"
echo "  - Swagger UI: http://localhost:8080/swagger-ui.html"
echo ""
echo "🎉 Face Recognition System is ready!"