#!/bin/bash

echo "🚀 Setting up Face Recognition System"
echo "====================================="

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

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before running the application"
fi

# Download face recognition models
echo "📥 Downloading face recognition models..."
mkdir -p backend/src/main/resources/models

# Download Haar Cascade classifier
if [ ! -f backend/src/main/resources/models/haarcascade_frontalface_alt.xml ]; then
    echo "Downloading Haar Cascade classifier..."
    curl -L -o backend/src/main/resources/models/haarcascade_frontalface_alt.xml \
        https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_alt.xml
fi

# Download face-api.js models for frontend
echo "📥 Downloading face-api.js models..."
mkdir -p frontend/src/assets/face-api-weights

# Download face-api.js model files
MODELS=(
    "tiny_face_detector_model-weights_manifest.json"
    "tiny_face_detector_model-shard1"
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-shard1"
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-shard1"
)

for model in "${MODELS[@]}"; do
    if [ ! -f "frontend/src/assets/face-api-weights/$model" ]; then
        echo "Downloading $model..."
        curl -L -o "frontend/src/assets/face-api-weights/$model" \
            "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/$model"
    fi
done

echo "✅ Face recognition models downloaded"

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."

if docker-compose ps | grep -q "Up"; then
    echo "✅ All services are running successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:4200"
    echo "   Backend API: http://localhost:8080/api"
    echo "   Database: localhost:5432"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open http://localhost:4200 in your browser"
    echo "   2. Register a new account"
    echo "   3. Start capturing faces!"
    echo ""
    echo "📚 For more information, check the README.md file"
else
    echo "❌ Some services failed to start. Check the logs with:"
    echo "   docker-compose logs"
fi

echo ""
echo "🎉 Setup complete!"