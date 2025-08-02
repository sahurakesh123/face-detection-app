import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FaceDetectionService, DetectionResponse } from '../../services/face-detection.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-face-detection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div class="detection-container">
      <mat-card class="detection-card">
        <mat-card-header>
          <mat-card-title>Live Face Detection</mat-card-title>
          <mat-card-subtitle>Capture and detect faces in real-time</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="camera-section">
            <div class="camera-container" *ngIf="!isCapturing">
              <video #videoElement class="camera-video" autoplay playsinline></video>
              <div class="camera-overlay" *ngIf="isStreamActive"></div>
              <div class="detection-status" *ngIf="isStreamActive">
                <mat-chip color="primary" selected>Live Camera Active</mat-chip>
              </div>
            </div>

            <div class="capture-preview" *ngIf="isCapturing">
              <canvas #canvasElement class="camera-video"></canvas>
              <div class="capture-overlay">
                <mat-chip color="accent" selected>Processing...</mat-chip>
              </div>
            </div>

            <div class="camera-controls">
              <button 
                mat-raised-button 
                color="primary" 
                (click)="startCamera()" 
                [disabled]="isStreamActive || isLoading"
                class="control-button">
                <mat-icon>videocam</mat-icon>
                Start Camera
              </button>

              <button 
                mat-raised-button 
                color="accent" 
                (click)="captureImage()" 
                [disabled]="!isStreamActive || isCapturing || isLoading"
                class="control-button">
                <mat-icon>camera_alt</mat-icon>
                Capture Face
              </button>

              <button 
                mat-raised-button 
                color="warn" 
                (click)="stopCamera()" 
                [disabled]="!isStreamActive"
                class="control-button">
                <mat-icon>videocam_off</mat-icon>
                Stop Camera
              </button>
            </div>
          </div>

          <div class="detection-results" *ngIf="detectionResult">
            <mat-card class="result-card" [ngClass]="detectionResult.matched ? 'match-found' : 'no-match'">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>{{ detectionResult.matched ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ detectionResult.matched ? 'Face Matched!' : 'No Match Found' }}
                </mat-card-title>
              </mat-card-header>

              <mat-card-content *ngIf="detectionResult.matched && detectionResult.user">
                <div class="user-info">
                  <h3>{{ detectionResult.user.firstName }} {{ detectionResult.user.lastName }}</h3>
                  <p><strong>Email:</strong> {{ detectionResult.user.email }}</p>
                  <p><strong>Confidence:</strong> {{ (detectionResult.detection?.confidenceScore || 0) * 100 | number:'1.0-2' }}%</p>
                  <p><strong>Detected At:</strong> {{ detectionResult.detection?.detectedAt | date:'medium' }}</p>
                </div>
              </mat-card-content>

              <mat-card-content *ngIf="!detectionResult.matched">
                <p>No matching user found in the database.</p>
                <p>Make sure the person is registered in the system.</p>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="loading-section" *ngIf="isLoading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Processing face detection...</p>
          </div>

          <div class="error-section" *ngIf="errorMessage">
            <div class="error-message">
              <mat-icon>error</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .detection-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .detection-card {
      padding: 20px;
    }

    .camera-section {
      margin-bottom: 20px;
    }

    .camera-container, .capture-preview {
      position: relative;
      width: 100%;
      max-width: 640px;
      margin: 0 auto 20px;
    }

    .camera-video {
      width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 3px solid #3f51b5;
      border-radius: 8px;
      pointer-events: none;
    }

    .capture-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .detection-status {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .camera-controls {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .control-button {
      min-width: 120px;
    }

    .detection-results {
      margin-top: 20px;
    }

    .result-card {
      border-radius: 12px;
      overflow: hidden;
    }

    .match-found {
      border-left: 4px solid #4caf50;
      background-color: #f1f8e9;
    }

    .no-match {
      border-left: 4px solid #f44336;
      background-color: #ffebee;
    }

    .user-info h3 {
      color: #3f51b5;
      margin-bottom: 10px;
    }

    .user-info p {
      margin: 5px 0;
    }

    .loading-section {
      text-align: center;
      padding: 40px;
    }

    .loading-section p {
      margin-top: 16px;
      color: #666;
    }

    .error-section {
      margin-top: 20px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background-color: #ffebee;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #3f51b5;
    }

    @media (max-width: 600px) {
      .camera-controls {
        flex-direction: column;
        align-items: center;
      }
      
      .control-button {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class FaceDetectionComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  isStreamActive = false;
  isCapturing = false;
  isLoading = false;
  errorMessage = '';
  detectionResult: DetectionResponse | null = null;
  private stream: MediaStream | null = null;

  constructor(
    private faceDetectionService: FaceDetectionService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    try {
      this.errorMessage = '';
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      this.videoElement.nativeElement.srcObject = this.stream;
      this.isStreamActive = true;
      
      this.snackBar.open('Camera started successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.errorMessage = 'Failed to access camera. Please check permissions.';
      this.snackBar.open(this.errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isStreamActive = false;
    this.isCapturing = false;
    this.detectionResult = null;
    this.errorMessage = '';
  }

  async captureImage(): Promise<void> {
    if (!this.isStreamActive) {
      this.snackBar.open('Please start the camera first', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      this.isCapturing = true;
      this.isLoading = true;
      this.errorMessage = '';
      this.detectionResult = null;

      // Capture image from video stream
      const canvas = this.canvasElement.nativeElement;
      const video = this.videoElement.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to capture image'));
        }, 'image/jpeg', 0.8);
      });

      const imageFile = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });

      // Get current location
      let location: { latitude: number; longitude: number } | undefined;
      try {
        location = await this.faceDetectionService.getCurrentLocation();
      } catch (error) {
        console.warn('Could not get location:', error);
      }

      // Detect face
      this.faceDetectionService.detectFace(imageFile, location).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isCapturing = false;
          this.detectionResult = response;

          if (response.matched) {
            this.snackBar.open('Face detected and matched!', 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('No matching face found', 'Close', {
              duration: 3000,
              panelClass: ['info-snackbar']
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.isCapturing = false;
          this.errorMessage = error.error?.error || 'Face detection failed';
          this.snackBar.open(this.errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });

    } catch (error) {
      this.isLoading = false;
      this.isCapturing = false;
      this.errorMessage = 'Failed to capture image';
      this.snackBar.open(this.errorMessage, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }
}