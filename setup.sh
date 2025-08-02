#!/bin/bash

# Face Recognition System Setup Script
echo "🔧 Setting up Face Recognition System..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for required tools
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed. Please install Java 17 or higher."
        exit 1
    fi
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        print_error "Maven is not installed. Please install Maven 3.6+."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check MySQL (optional)
    if ! command -v mysql &> /dev/null; then
        print_warning "MySQL client not found. Make sure MySQL server is running on localhost:3306"
    fi
    
    print_status "Prerequisites check completed ✓"
}

# Setup backend
setup_backend() {
    print_status "Setting up Spring Boot backend..."
    
    cd backend
    
    # Clean and compile
    print_status "Cleaning and compiling backend..."
    mvn clean compile
    
    if [ $? -ne 0 ]; then
        print_error "Backend compilation failed!"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p uploads/faces
    mkdir -p src/main/resources/models
    
    print_status "Backend setup completed ✓"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up Angular frontend..."
    
    cd frontend
    
    # Install Angular CLI globally if not present
    if ! command -v ng &> /dev/null; then
        print_status "Installing Angular CLI..."
        npm install -g @angular/cli
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        print_error "Frontend dependency installation failed!"
        exit 1
    fi
    
    print_status "Frontend setup completed ✓"
    cd ..
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if MySQL is accessible
    if command -v mysql &> /dev/null; then
        print_status "Creating database (requires MySQL root access)..."
        mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS face_recognition_db;" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            print_status "Database created successfully ✓"
        else
            print_warning "Could not create database automatically. Please create 'face_recognition_db' manually."
        fi
    else
        print_warning "MySQL client not found. Please ensure MySQL server is running and create 'face_recognition_db' database manually."
    fi
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Backend startup script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting Face Recognition Backend..."
cd backend
mvn spring-boot:run
EOF
    
    # Frontend startup script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "Starting Face Recognition Frontend..."
cd frontend
ng serve --host 0.0.0.0 --port 4200
EOF
    
    # Combined startup script
    cat > start-all.sh << 'EOF'
#!/bin/bash
echo "Starting Face Recognition System..."
echo "=================================="

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo "Starting backend server..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 30

# Start frontend
echo "Starting frontend server..."
cd frontend
ng serve --host 0.0.0.0 --port 4200 &
FRONTEND_PID=$!
cd ..

echo ""
echo "🚀 Face Recognition System is starting up!"
echo "📊 Backend API: http://localhost:8080/api"
echo "🌐 Frontend UI: http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    
    # Make scripts executable
    chmod +x start-backend.sh start-frontend.sh start-all.sh
    
    print_status "Startup scripts created ✓"
}

# Create configuration file template
create_config_template() {
    print_status "Creating configuration template..."
    
    cat > backend/src/main/resources/application-template.properties << 'EOF'
# Copy this file to application.properties and configure your settings

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/face_recognition_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# Email Configuration (Gmail example)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Twilio Configuration (for SMS)
twilio.account.sid=your-twilio-account-sid
twilio.auth.token=your-twilio-auth-token
twilio.phone.number=your-twilio-phone-number

# Other configurations remain the same...
EOF
    
    print_status "Configuration template created ✓"
}

# Print setup completion message
print_completion_message() {
    echo ""
    echo "🎉 Face Recognition System Setup Complete!"
    echo "=========================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure your database, email, and SMS settings in:"
    echo "   backend/src/main/resources/application.properties"
    echo ""
    echo "2. Start the system:"
    echo "   ./start-all.sh    (starts both backend and frontend)"
    echo "   ./start-backend.sh (starts only backend)"
    echo "   ./start-frontend.sh (starts only frontend)"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:4200"
    echo "   Backend API: http://localhost:8080/api"
    echo ""
    echo "📖 API Documentation:"
    echo "   Registration: POST /api/persons/register"
    echo "   Face Detection: POST /api/face/detect"
    echo "   Get Persons: GET /api/persons"
    echo ""
    echo "⚠️  Important Notes:"
    echo "   - Ensure MySQL server is running"
    echo "   - Configure email and SMS credentials for notifications"
    echo "   - Allow camera permissions in your browser"
    echo "   - For production, use proper SSL certificates"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Check logs in backend/logs/"
    echo "   - Verify database connectivity"
    echo "   - Ensure ports 8080 and 4200 are available"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    setup_backend
    setup_frontend
    setup_database
    create_startup_scripts
    create_config_template
    print_completion_message
}

# Run main function
main "$@"