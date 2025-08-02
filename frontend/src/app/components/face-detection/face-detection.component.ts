import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
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
                <div class="camera-container" *ngIf="cameraActive">
                  <video #videoElement autoplay muted [style.width.px]="480" [style.height.px]="360"></video>
                  <canvas #canvasElement [width]="480" [height]="360" style="display: none;"></canvas>
                </div>

                <div class="camera-placeholder" *ngIf="!cameraActive">
                  <mat-icon>camera_alt</mat-icon>
                  <p>Camera not active</p>
                </div>

                <div class="camera-controls mt-3">
                  <button mat-raised-button color="primary" 
                          (click)="startCamera()" *ngIf="!cameraActive" class="me-2">
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
export class FaceDetectionComponent implements OnInit, OnDestroy {
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

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 480, height: 360 } 
      });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      this.cameraActive = true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.snackBar.open('Error accessing camera. Please check permissions.', 'Close', {
        duration: 5000
      });
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive = false;
  }

  captureAndDetect() {
    if (!this.cameraActive) return;

    this.isProcessing = true;
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(video, 0, 0, 480, 360);
      canvas.toBlob((blob) => {
        if (blob) {
          this.processDetection(blob);
        } else {
          this.isProcessing = false;
        }
      }, 'image/jpeg', 0.8);
    }
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