import { Component, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { WebSocketService } from '../../services/websocket.service';
import { FaceDetectionResponse, GeolocationCoordinates, DetectionLog, DetectionRequest } from '../../models/detection.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-face-detection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <div class="row">
        <!-- Camera Section -->
        <div class="col-lg-6">
          <mat-card class="camera-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>camera_alt</mat-icon>
                Live Face Detection
              </mat-card-title>
              <mat-card-subtitle>
                Capture faces from live camera feed
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="camera-section">
                <div class="camera-container">
                  <!-- Video and canvas elements are always present but hidden when camera is not active -->
                  <video #videoElement autoplay muted
                         [style.width.px]="480"
                         [style.height.px]="360"
                         [style.display]="cameraActive ? 'block' : 'none'"></video>
                  <canvas #canvasElement [width]="480" [height]="360" style="display: none;"></canvas>

                  <!-- Camera placeholder shown when camera is not active -->
                  <div class="camera-placeholder" *ngIf="!cameraActive">
                    <mat-icon>camera_alt</mat-icon>
                    <p>Camera not active</p>
                  </div>
                </div>

                <div class="camera-controls mt-3">
                  <button mat-raised-button color="primary"
                          (click)="safeStartCamera()" *ngIf="!cameraActive" class="me-2" matTooltip="Start the camera feed">
                    <mat-icon>videocam</mat-icon>
                    Start Camera
                  </button>

                  <button mat-raised-button color="accent"
                          (click)="captureAndDetect()"
                          *ngIf="cameraActive"
                          [disabled]="isProcessing"
                          class="btn-capture me-2" matTooltip="Capture the current frame and detect faces">
                    <mat-spinner diameter="20" *ngIf="isProcessing" class="me-2"></mat-spinner>
                    <mat-icon *ngIf="!isProcessing">camera</mat-icon>
                    {{ isProcessing ? 'Processing...' : 'Capture & Detect' }}
                  </button>

                  <button mat-raised-button color="warn"
                          (click)="testCapture()"
                          *ngIf="cameraActive"
                          class="me-2" matTooltip="Capture a test image without sending to backend">
                    <mat-icon>bug_report</mat-icon>
                    Test Capture
                  </button>

                  <button mat-raised-button color="primary"
                          (click)="restartCamera()"
                          *ngIf="cameraActive"
                          class="me-2" matTooltip="Stop and start the camera again">
                    <mat-icon>refresh</mat-icon>
                    Restart Camera
                  </button>

                  <button mat-button color="warn" (click)="stopCamera()" *ngIf="cameraActive" matTooltip="Stop the camera feed">
                    <mat-icon>stop</mat-icon>
                    Stop Camera
                  </button>
                </div>

                <!-- Camera Settings -->
                <div class="camera-settings mt-3">
                  <mat-form-field appearance="outline" class="me-2">
                    <mat-label>Camera ID</mat-label>
                    <input matInput [(ngModel)]="cameraId" placeholder="Camera-001">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Camera Type</mat-label>
                    <input matInput [(ngModel)]="cameraType" placeholder="browser">
                  </mat-form-field>
                </div>

                <!-- Location Info -->
                <div class="location-info mt-3" *ngIf="currentLocation">
                  <h6><mat-icon>location_on</mat-icon> Current Location</h6>
                  <p class="text-muted mb-0">
                    Lat: {{ currentLocation.latitude | number:'1.6-6' }}, 
                    Lng: {{ currentLocation.longitude | number:'1.6-6' }}
                  </p>
                  <p class="text-muted" *ngIf="locationAddress">{{ locationAddress }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Results Section -->
        <div class="col-lg-6">
          <mat-card class="results-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>search</mat-icon>
                Detection Results
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="results-section">
                <div *ngIf="!lastDetectionResult" class="no-results">
                  <mat-icon>info</mat-icon>
                  <p>No detection results yet. Capture a face to see results.</p>
                </div>

                <div *ngIf="lastDetectionResult" class="detection-result">
                  <div class="result-header">
                    <h5 class="mb-3">
                      <mat-icon [class]="lastDetectionResult.matched ? 'text-success' : 'text-warning'">
                        {{ lastDetectionResult.matched ? 'check_circle' : 'warning' }}
                      </mat-icon>
                      {{ lastDetectionResult.matched ? 'Person Identified' : 'Unknown Person' }}
                    </h5>
                  </div>

                  <div class="result-details" *ngIf="lastDetectionResult.person">
                    <div class="person-info">
                      <h6>Person Details:</h6>
                      <p><strong>Name:</strong> {{ lastDetectionResult.person.firstName }} {{ lastDetectionResult.person.lastName }}</p>
                      <p><strong>Email:</strong> {{ lastDetectionResult.person.email }}</p>
                      <p *ngIf="lastDetectionResult.person.phoneNumber">
                        <strong>Phone:</strong> {{ lastDetectionResult.person.phoneNumber }}
                      </p>
                    </div>

                    <div class="notification-status mt-3">
                      <h6>Notifications:</h6>
                      <div class="alert alert-success">
                        <mat-icon>email</mat-icon>
                        Email notification sent to {{ lastDetectionResult.person.email }}
                      </div>
                      <div class="alert alert-info" *ngIf="lastDetectionResult.person.phoneNumber">
                        <mat-icon>sms</mat-icon>
                        SMS notification sent to {{ lastDetectionResult.person.phoneNumber }}
                      </div>
                    </div>
                  </div>

                  <div class="detection-metadata mt-3">
                    <div class="row">
                      <div class="col-6">
                        <small class="text-muted">Confidence Score</small>
                        <div class="confidence-bar">
                          <div class="confidence-fill" 
                               [style.width.%]="(lastDetectionResult.confidence * 100)">
                          </div>
                          <span class="confidence-text">{{ (lastDetectionResult.confidence * 100) | number:'1.1-1' }}%</span>
                        </div>
                      </div>
                      <div class="col-6">
                        <small class="text-muted">Detection Time</small>
                        <p class="mb-0">{{ lastDetectionResult.detectionTime | date:'short' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Quick Actions -->
          <mat-card class="quick-actions-card mt-3">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>flash_on</mat-icon>
                Quick Actions
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="d-grid gap-2">
                <button mat-raised-button color="primary" routerLink="/register">
                  <mat-icon>person_add</mat-icon>
                  Register New Person
                </button>
                
                <button mat-raised-button color="accent" routerLink="/persons">
                  <mat-icon>people</mat-icon>
                  View All Persons
                </button>
                
                <button mat-raised-button routerLink="/detections">
                  <mat-icon>history</mat-icon>
                  Detection History
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .camera-card, .results-card, .quick-actions-card {
      height: fit-content;
    }

    .camera-section {
      text-align: center;
    }

    .camera-container {
      background: #000;
      border-radius: 12px;
      display: inline-block;
      overflow: hidden;
      position: relative;
    }

    .camera-placeholder {
      background: #f5f5f5;
      border: 2px dashed #ddd;
      border-radius: 12px;
      padding: 4rem 2rem;
      color: #999;
    }

    .camera-placeholder mat-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
    }

    .camera-controls {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .camera-settings {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .camera-settings mat-form-field {
      min-width: 150px;
    }

    .location-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      text-align: left;
    }

    .location-info h6 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #3f51b5;
    }

    .results-section {
      min-height: 200px;
    }

    .no-results {
      text-align: center;
      color: #999;
      padding: 2rem;
    }

    .no-results mat-icon {
      font-size: 3rem;
      height: 3rem;
      width: 3rem;
      margin-bottom: 1rem;
    }

    .detection-result {
      text-align: left;
    }

    .result-header h5 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .person-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
    }

    .confidence-bar {
      position: relative;
      background: #e0e0e0;
      border-radius: 20px;
      height: 24px;
      overflow: hidden;
    }

    .confidence-fill {
      background: linear-gradient(45deg, #4caf50, #81c784);
      height: 100%;
      transition: width 0.3s ease;
    }

    .confidence-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.8rem;
      font-weight: 500;
      color: #333;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-info {
      background-color: #e3f2fd;
      color: #1976d2;
      border: 1px solid #bbdefb;
    }

    .text-success {
      color: #4caf50 !important;
    }

    .text-warning {
      color: #ff9800 !important;
    }

    @media (max-width: 768px) {
      .camera-settings {
        flex-direction: column;
        align-items: stretch;
      }
      
      .camera-controls {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class FaceDetectionComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  cameraActive = false;
  isProcessing = false;
  mediaStream: MediaStream | null = null;
  currentLocation: GeolocationCoordinates | null = null;
  locationAddress = '';
  cameraId = '';
  cameraType = 'browser';
  lastDetectionResult: FaceDetectionResponse | null = null;

  // Image settings for performance
  private readonly imageMaxWidth = 640;
  private readonly imageQuality = 0.92;

  private wsSubscription!: Subscription;

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.getCurrentLocation();
    this.connectToWebSocket();
  }

  ngAfterViewInit() {
    console.log('View initialized, camera elements ready:', this.checkCameraElementsReady());
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

  connectToWebSocket(): void {
    // Connect to the WebSocket endpoint (URL is now configured in the service)
    this.webSocketService.connect();

    // Subscribe to connection status
    this.webSocketService.onConnect().subscribe(connected => {
      if (connected) {
        console.log('Successfully connected to WebSocket broker.');
        this.subscribeToDetectionResults();
      } else {
        console.log('Disconnected from WebSocket broker.');
      }
    });
  }

  subscribeToDetectionResults(): void {
    const topic = `/topic/detection-results/${this.cameraId}`;
    console.log(`Subscribing to WebSocket topic: ${topic}`)
    this.wsSubscription = this.webSocketService.subscribe(topic).subscribe((message) => {
      const result: DetectionLog = JSON.parse(message.body);
      console.log('Received detection result via WebSocket:', result);
      this.lastDetectionResult = this.mapDetectionLogToResponse(result);
      this.isProcessing = false; // Stop the spinner
      this.snackBar.open('Detection result received!', 'Close', { duration: 3000 });
    });

    // Also subscribe to the error topic
    const errorTopic = `/topic/detection-error/${this.cameraId}`;
    this.webSocketService.subscribe(errorTopic).subscribe((message) => {
      console.error('Received error via WebSocket:', message.body);
      this.snackBar.open(`Error from server: ${message.body}`, 'Close', { duration: 7000 });
      this.isProcessing = false;
    });
  }

  safeStartCamera() {
    if (!this.checkCameraElementsReady()) {
      // If elements are not ready, wait a bit and try again
      setTimeout(() => {
        if (this.checkCameraElementsReady()) {
          this.startCamera();
        } else {
          console.error('Camera elements still not ready after delay');
          this.snackBar.open('Camera interface not ready. Please refresh the page.', 'Close', {
            duration: 5000
          });
        }
      }, 100);
    } else {
      this.startCamera();
    }
  }

  async startCamera() {
    try {
      // Check if elements are ready
      if (!this.checkCameraElementsReady()) {
        console.warn('Camera elements not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait and retry
        if (!this.checkCameraElementsReady()) {
          this.snackBar.open('Camera elements failed to initialize.', 'Close', { duration: 3000 });
          return;
        }
      }

      // Stop any existing stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }

      // Get the media stream with higher resolution
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 360 },
          frameRate: { ideal: 15 }
        }
      });

      this.videoElement.nativeElement.srcObject = this.mediaStream;
      await this.videoElement.nativeElement.play();
      this.cameraActive = true;
      this.snackBar.open('Camera started successfully!', 'Close', { duration: 2000 });

    } catch (error) {
      console.error('Error starting camera:', error);
      this.snackBar.open('Could not start camera. Please check permissions.', 'Close', { duration: 5000 });
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive = false;
    console.log('Camera stopped');
  }

  // Method to restart camera (useful when video stream gets corrupted)
  restartCamera() {
    console.log('Restarting camera...');
    this.stopCamera();
    setTimeout(() => {
      this.safeStartCamera();
    }, 1000); // Wait 1 second before restarting
  }

  // Check if video stream is healthy
  checkVideoHealth(): boolean {
    if (!this.videoElement || !this.videoElement.nativeElement) {
      return false;
    }

    const video = this.videoElement.nativeElement;
    const isHealthy = video.videoWidth > 0 &&
                     video.videoHeight > 0 &&
                     video.readyState >= 3 &&
                     !video.paused &&
                     !video.ended &&
                     video.srcObject !== null;

    console.log('Video health check:', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      ended: video.ended,
      hasSrcObject: !!video.srcObject,
      isHealthy: isHealthy
    });

    return isHealthy;
  }

  captureAndDetect(): void {
    if (!this.currentLocation) {
      this.snackBar.open('Could not get location. Cannot proceed with detection.', 'Close', { duration: 5000 });
      this.getCurrentLocation();
      return;
    }

    this.isProcessing = true;
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const fullBase64Image = canvas.toDataURL('image/jpeg');
      // Strip the prefix from the base64 string
      const base64Image = fullBase64Image.replace(/^data:image\/jpeg;base64,/, '');

      const request: DetectionRequest = {
        base64Image: base64Image,
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        cameraId: this.cameraId,
        cameraType: this.cameraType
      };

      // Call the non-blocking API endpoint
      this.apiService.detectFace(request).subscribe({
        next: (response) => {
          console.log('Detection request accepted by server:', response);
          this.snackBar.open('Detection in progress...', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Error sending detection request:', err);
          this.snackBar.open('Failed to send detection request.', 'Close', { duration: 5000 });
          this.isProcessing = false;
        }
      });
    }
  }

  // Helper to map backend log to frontend response model
  mapDetectionLogToResponse(log: DetectionLog): FaceDetectionResponse {
      return {
          success: !!log.person,
          matched: !!log.person,
          person: log.person,
          confidence: log.confidenceScore,
          detectionTime: log.detectionTime,
          detectionId: log.id,
          message: log.person ? 'Match found' : 'No match found'
      };
  }

  private checkImageData(imageData: ImageData): boolean {
    const data = imageData.data;
    let nonWhitePixels = 0;

    // Check if there are non-white pixels (indicating actual image content)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If pixel is not white or very close to white
      if (r < 250 || g < 250 || b < 250) {
        nonWhitePixels++;
      }
    }

    const totalPixels = data.length / 4;
    const nonWhitePercentage = (nonWhitePixels / totalPixels) * 100;

    console.log('Image data check:', {
      totalPixels,
      nonWhitePixels,
      nonWhitePercentage: nonWhitePercentage.toFixed(2) + '%'
    });

    // If more than 5% of pixels are non-white, we likely have image content
    return nonWhitePercentage > 5;
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.getAddressFromCoordinates();
        },
        (error) => {
          console.error('Error getting location:', error);
          const errorMessage = `Geolocation error: ${error.message}. Please ensure location services are enabled and permissions are granted for this site.`;
          this.snackBar.open(errorMessage, 'Close', { duration: 7000 });
          this.currentLocation = null; // Explicitly set to null on error
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for better accuracy
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.snackBar.open('Geolocation is not supported by this browser.', 'Close', { duration: 5000 });
      this.currentLocation = null; // Explicitly set to null
    }
  }

  getAddressFromCoordinates() {
    if (!this.currentLocation) return;
    
    // In a real application, you would use a geocoding service here
    // For demo purposes, we'll create a simple address format
    this.locationAddress = `Lat: ${this.currentLocation.latitude.toFixed(6)}, Lng: ${this.currentLocation.longitude.toFixed(6)}`;
  }

  // Debug method to test image capture without sending to backend
  testCapture() {
    if (!this.cameraActive) {
      console.warn('Camera is not active');
      return;
    }

    if (!this.videoElement || !this.videoElement.nativeElement) {
      console.error('Video element not available');
      return;
    }

    if (!this.canvasElement || !this.canvasElement.nativeElement) {
      console.error('Canvas element not available');
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      try {
        console.log('Testing image capture...');
        console.log('Video state for test:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          currentTime: video.currentTime,
          paused: video.paused
        });

        // Use the same capture logic as the main method
        const captureWidth = video.videoWidth;
        const captureHeight = video.videoHeight;

        canvas.width = captureWidth;
        canvas.height = captureHeight;

        // Set high-quality rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Clear with white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, captureWidth, captureHeight);

        // Draw video frame
        context.drawImage(video, 0, 0, captureWidth, captureHeight);

        // Check image data
        const imageData = context.getImageData(0, 0, Math.min(50, captureWidth), Math.min(50, captureHeight));
        const hasImageData = this.checkImageData(imageData);

        console.log('Test capture has image data:', hasImageData);

        // Convert to data URL for testing
        const dataURL = canvas.toDataURL('image/jpeg', 0.95);
        console.log('Test capture results:', {
          dataURLLength: dataURL.length,
          estimatedSizeKB: Math.round(dataURL.length * 0.75 / 1024), // Rough estimate
          hasImageData: hasImageData
        });

        // Create blob to test size
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Test blob created:', {
              size: blob.size,
              sizeKB: Math.round(blob.size / 1024),
              type: blob.type
            });

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `test-capture-${Date.now()}.jpg`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.snackBar.open(`Test image captured (${Math.round(blob.size / 1024)}KB)`, 'Close', { duration: 3000 });
          } else {
            console.error('Failed to create test blob');
            this.snackBar.open('Failed to create test image', 'Close', { duration: 3000 });
          }
        }, 'image/jpeg', 0.95);

      } catch (error) {
        console.error('Error in test capture:', error);
        this.snackBar.open('Error in test capture', 'Close', { duration: 3000 });
      }
    }
  }

  private checkCameraElementsReady(): boolean {
    return !!(this.videoElement && this.videoElement.nativeElement &&
              this.canvasElement && this.canvasElement.nativeElement);
  }
}