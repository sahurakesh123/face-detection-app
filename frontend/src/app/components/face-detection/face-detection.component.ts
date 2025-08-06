import { Component, ElementRef, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { FaceDetectionResponse, GeolocationCoordinates } from '../../models/detection.model';

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
    MatInputModule
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
                          (click)="safeStartCamera()" *ngIf="!cameraActive" class="me-2">
                    <mat-icon>videocam</mat-icon>
                    Start Camera
                  </button>

                  <button mat-raised-button color="accent"
                          (click)="captureAndDetect()"
                          *ngIf="cameraActive"
                          [disabled]="isProcessing"
                          class="btn-capture me-2">
                    <mat-spinner diameter="20" *ngIf="isProcessing" class="me-2"></mat-spinner>
                    <mat-icon *ngIf="!isProcessing">camera</mat-icon>
                    {{ isProcessing ? 'Processing...' : 'Capture & Detect' }}
                  </button>

                  <button mat-raised-button color="warn"
                          (click)="testCapture()"
                          *ngIf="cameraActive"
                          class="me-2">
                    <mat-icon>bug_report</mat-icon>
                    Test Capture
                  </button>

                  <button mat-raised-button color="primary"
                          (click)="restartCamera()"
                          *ngIf="cameraActive"
                          class="me-2">
                    <mat-icon>refresh</mat-icon>
                    Restart Camera
                  </button>

                  <button mat-button color="warn" (click)="stopCamera()" *ngIf="cameraActive">
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

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.getCurrentLocation();
  }

  ngAfterViewInit() {
    // ViewChild elements are now available
    console.log('View initialized, camera elements ready:', this.checkCameraElementsReady());
  }

  // Safe method to start camera that can be called from template
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

  ngOnDestroy() {
    this.stopCamera();
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

  async startCamera() {
    try {
      // Check if elements are ready
      if (!this.checkCameraElementsReady()) {
        console.error('Camera elements not ready');
        this.snackBar.open('Camera interface not ready. Please try again.', 'Close', {
          duration: 3000
        });
        return;
      }

      // Get the media stream with higher resolution
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 480 },
          height: { ideal: 480, min: 360 },
          facingMode: 'user' // Front camera for selfies
        }
      });

      // Set the video source
      const videoElement = this.videoElement.nativeElement;
      videoElement.srcObject = this.mediaStream;

      // Create a promise to wait for video to be fully ready
      const videoReady = new Promise<void>((resolve, reject) => {
        let resolved = false;

        const checkVideoReady = () => {
          if (resolved) return;

          console.log('Checking video readiness:', {
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            readyState: videoElement.readyState,
            currentTime: videoElement.currentTime,
            paused: videoElement.paused
          });

          // Check if video has valid dimensions and is ready
          if (videoElement.videoWidth > 0 &&
              videoElement.videoHeight > 0 &&
              videoElement.readyState >= 3 && // HAVE_FUTURE_DATA
              videoElement.currentTime > 0) {
            resolved = true;
            resolve();
          }
        };

        const onLoadedData = () => {
          console.log('Video loadeddata event fired');
          setTimeout(checkVideoReady, 100); // Small delay to ensure video is really ready
        };

        const onCanPlay = () => {
          console.log('Video canplay event fired');
          setTimeout(checkVideoReady, 100);
        };

        const onTimeUpdate = () => {
          console.log('Video timeupdate event fired');
          checkVideoReady();
        };

        const onError = (error: any) => {
          console.error('Video loading error:', error);
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        };

        // Listen for multiple events to ensure video is ready
        videoElement.addEventListener('loadeddata', onLoadedData, { once: true });
        videoElement.addEventListener('canplay', onCanPlay, { once: true });
        videoElement.addEventListener('timeupdate', onTimeUpdate, { once: true });
        videoElement.addEventListener('error', onError, { once: true });

        // Timeout after 15 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Video loading timeout - camera may not be working properly'));
          }
        }, 15000);
      });

      // Start playing the video
      await videoElement.play();
      console.log('Video play() called successfully');

      // Wait for video to be fully ready
      await videoReady;

      // Set cameraActive to true to show the video
      this.cameraActive = true;
      console.log('Camera started successfully and ready for capture');

      // Wait a bit more to ensure video stream is stable before allowing capture
      setTimeout(() => {
        console.log('Camera is now stable and ready for capture');
        this.snackBar.open('Camera ready for capture!', 'Close', { duration: 2000 });
      }, 2000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      this.cameraActive = false;

      // Provide more specific error messages
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            this.snackBar.open('Camera access denied. Please allow camera permissions.', 'Close', {
              duration: 5000
            });
            break;
          case 'NotFoundError':
            this.snackBar.open('No camera found. Please connect a camera.', 'Close', {
              duration: 5000
            });
            break;
          case 'NotReadableError':
            this.snackBar.open('Camera is already in use by another application.', 'Close', {
              duration: 5000
            });
            break;
          default:
            this.snackBar.open('Error accessing camera: ' + error.message, 'Close', {
              duration: 5000
            });
        }
      } else {
        this.snackBar.open('Error accessing camera. Please check permissions.', 'Close', {
          duration: 5000
        });
      }
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

  captureAndDetect() {
    if (!this.cameraActive) {
      console.warn('Camera is not active');
      return;
    }

    // Check if video and canvas elements are available
    if (!this.videoElement || !this.videoElement.nativeElement) {
      console.error('Video element not available');
      this.snackBar.open('Camera not properly initialized.', 'Close', { duration: 3000 });
      return;
    }

    if (!this.canvasElement || !this.canvasElement.nativeElement) {
      console.error('Canvas element not available');
      this.snackBar.open('Canvas not properly initialized.', 'Close', { duration: 3000 });
      return;
    }

    // Check video stream health before capture
    if (!this.checkVideoHealth()) {
      console.error('Video stream is not healthy');
      this.snackBar.open('Video stream issue detected. Try restarting the camera.', 'Close', { duration: 5000 });
      return;
    }

    this.isProcessing = true;
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      try {
        // Validate video element state before capturing
        console.log('Video element state before capture:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          currentTime: video.currentTime,
          paused: video.paused,
          ended: video.ended,
          srcObject: !!video.srcObject
        });

        // Check if video has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.error('Video has no dimensions - video not loaded properly');
          this.isProcessing = false;
          this.snackBar.open('Video not loaded properly. Please restart camera.', 'Close', { duration: 3000 });
          return;
        }

        // Check if video is ready (must have current data)
        if (video.readyState < 3) { // HAVE_FUTURE_DATA - more strict check
          console.error('Video not ready for capture, readyState:', video.readyState);
          this.isProcessing = false;
          this.snackBar.open('Video not ready. Please wait and try again.', 'Close', { duration: 3000 });
          return;
        }

        // Wait a moment to ensure video frame is stable
        setTimeout(() => {
          this.performCapture(video, canvas, context);
        }, 500); // Increased delay to ensure video is stable

      } catch (error) {
        console.error('Error in capture preparation:', error);
        this.isProcessing = false;
        this.snackBar.open('Error preparing capture.', 'Close', { duration: 3000 });
      }
    } else {
      console.error('Canvas context not available');
      this.isProcessing = false;
      this.snackBar.open('Canvas not properly initialized.', 'Close', { duration: 3000 });
    }
  }

  private performCapture(video: HTMLVideoElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    try {
      // Use actual video dimensions for better quality
      const captureWidth = video.videoWidth || 640;
      const captureHeight = video.videoHeight || 480;

      console.log('Performing capture with dimensions:', captureWidth, 'x', captureHeight);
      console.log('Video state during capture:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        currentTime: video.currentTime,
        paused: video.paused,
        ended: video.ended
      });

      // Wait for next animation frame to ensure video is rendered
      requestAnimationFrame(() => {
        try {
          // Set canvas to high resolution
          canvas.width = captureWidth;
          canvas.height = captureHeight;

          // Set high-quality rendering
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          // Clear canvas with white background (helps detect if capture fails)
          context.fillStyle = 'white';
          context.fillRect(0, 0, captureWidth, captureHeight);

          // Draw the video frame to canvas
          context.drawImage(video, 0, 0, captureWidth, captureHeight);

          // Check if the canvas actually has image data (not just white)
          const imageData = context.getImageData(0, 0, Math.min(50, captureWidth), Math.min(50, captureHeight));
          const hasImageData = this.checkImageData(imageData);

          console.log('Image content check result:', hasImageData);

          if (!hasImageData) {
            console.error('Canvas appears to be empty or white after drawing video');
            console.log('Trying alternative capture method...');
            this.tryAlternativeCapture(video, canvas, context);
            return;
          }

          // Convert to blob with maximum quality
          canvas.toBlob((blob) => {
            if (blob) {
              console.log('Image blob created successfully:', {
                size: blob.size,
                type: blob.type,
                sizeKB: Math.round(blob.size / 1024)
              });

              if (blob.size < 10000) { // Less than 10KB is suspicious
                console.warn('Image blob is very small (', blob.size, 'bytes), trying alternative method');
                this.tryAlternativeCapture(video, canvas, context);
                return;
              }

              this.processDetection(blob);
            } else {
              console.error('Failed to create image blob from canvas');
              this.tryAlternativeCapture(video, canvas, context);
            }
          }, 'image/jpeg', 0.95); // Very high quality

        } catch (drawError) {
          console.error('Error drawing to canvas:', drawError);
          this.tryAlternativeCapture(video, canvas, context);
        }
      });

    } catch (error) {
      console.error('Error in performCapture:', error);
      this.isProcessing = false;
      this.snackBar.open('Error capturing image.', 'Close', { duration: 3000 });
    }
  }

  private tryAlternativeCapture(video: HTMLVideoElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    console.log('Attempting alternative capture method...');

    try {
      // Create a new temporary canvas
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');

      if (!tempContext) {
        this.isProcessing = false;
        this.snackBar.open('Failed to create canvas context.', 'Close', { duration: 3000 });
        return;
      }

      const captureWidth = video.videoWidth || 640;
      const captureHeight = video.videoHeight || 480;

      tempCanvas.width = captureWidth;
      tempCanvas.height = captureHeight;

      // Try without clearing canvas first
      tempContext.drawImage(video, 0, 0, captureWidth, captureHeight);

      // Convert to blob
      tempCanvas.toBlob((blob) => {
        if (blob && blob.size > 5000) {
          console.log('Alternative capture successful:', {
            size: blob.size,
            sizeKB: Math.round(blob.size / 1024)
          });

          // Copy to main canvas for display
          canvas.width = captureWidth;
          canvas.height = captureHeight;
          context.clearRect(0, 0, captureWidth, captureHeight);
          context.drawImage(tempCanvas, 0, 0);

          this.processDetection(blob);
        } else {
          console.error('Alternative capture also failed');
          this.isProcessing = false;
          this.snackBar.open('Failed to capture image. Please restart camera and try again.', 'Close', { duration: 5000 });
        }
      }, 'image/jpeg', 0.95);

    } catch (error) {
      console.error('Alternative capture error:', error);
      this.isProcessing = false;
      this.snackBar.open('Image capture failed. Please restart camera.', 'Close', { duration: 5000 });
    }
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

  processDetection(imageBlob: Blob) {
    const formData = new FormData();
    formData.append('image', imageBlob, 'capture.jpg');
    
    if (this.currentLocation) {
      formData.append('latitude', this.currentLocation.latitude.toString());
      formData.append('longitude', this.currentLocation.longitude.toString());
    }
    
    if (this.cameraId) {
      formData.append('cameraId', this.cameraId);
    }
    
    formData.append('cameraType', this.cameraType);
    
    if (this.locationAddress) {
      formData.append('locationAddress', this.locationAddress);
    }

    this.apiService.detectFace(formData).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.lastDetectionResult = response;
        
        if (response.matched) {
          this.snackBar.open(
            `Person identified: ${response.person?.firstName} ${response.person?.lastName}`, 
            'Close', 
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
        } else {
          this.snackBar.open('Face detected but no match found in database', 'Close', {
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
        }
      },
      error: (error) => {
        this.isProcessing = false;
        const errorMessage = error.error?.message || 'Face detection failed. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
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
          console.warn('Geolocation error:', error);
          this.snackBar.open('Location access denied. Manual location entry may be required.', 'Close', {
            duration: 3000
          });
        }
      );
    }
  }

  getAddressFromCoordinates() {
    if (!this.currentLocation) return;
    
    // In a real application, you would use a geocoding service here
    // For demo purposes, we'll create a simple address format
    this.locationAddress = `Lat: ${this.currentLocation.latitude.toFixed(6)}, Lng: ${this.currentLocation.longitude.toFixed(6)}`;
  }
}