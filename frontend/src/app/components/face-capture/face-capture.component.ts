import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FaceRecognitionService, FaceCaptureRequest } from '../../services/face-recognition.service';

declare var faceapi: any;

@Component({
  selector: 'app-face-capture',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Face Capture & Recognition</mat-card-title>
          <mat-card-subtitle>Capture faces from various camera sources</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="camera-controls">
            <mat-form-field appearance="outline">
              <mat-label>Camera Source</mat-label>
              <mat-select [(value)]="selectedCameraSource">
                <mat-option value="browser">Browser Camera</mat-option>
                <mat-option value="laptop">Laptop Camera</mat-option>
                <mat-option value="atm">ATM Camera</mat-option>
                <mat-option value="cctv">CCTV Camera</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="button-group">
              <button 
                mat-raised-button 
                color="primary" 
                (click)="startCamera()"
                [disabled]="isCameraActive || isLoading">
                <mat-icon>videocam</mat-icon>
                Start Camera
              </button>

              <button 
                mat-raised-button 
                color="warn" 
                (click)="stopCamera()"
                [disabled]="!isCameraActive">
                <mat-icon>videocam_off</mat-icon>
                Stop Camera
              </button>

              <button 
                mat-raised-button 
                color="accent" 
                (click)="captureFace()"
                [disabled]="!isCameraActive || isLoading">
                <mat-icon>camera_alt</mat-icon>
                Capture Face
              </button>
            </div>
          </div>

          <div class="camera-container" *ngIf="isCameraActive">
            <video 
              #videoElement 
              class="camera-video" 
              autoplay 
              muted 
              playsinline>
            </video>
            
            <canvas 
              #canvasElement 
              class="camera-overlay">
            </canvas>

            <div class="face-detection-info" *ngIf="detectedFaces.length > 0">
              <p>Detected {{ detectedFaces.length }} face(s)</p>
              <p>Confidence: {{ (maxConfidence * 100).toFixed(1) }}%</p>
            </div>
          </div>

          <div class="loading-spinner" *ngIf="isLoading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Processing face capture...</p>
          </div>

          <div class="capture-result" *ngIf="lastCaptureResult">
            <h3>Last Capture Result</h3>
            <div class="result-details">
              <p><strong>Status:</strong> 
                <span [class]="lastCaptureResult.isMatched ? 'success' : 'info'">
                  {{ lastCaptureResult.isMatched ? 'Match Found!' : 'No Match' }}
                </span>
              </p>
              <p><strong>Confidence:</strong> {{ (lastCaptureResult.confidence * 100).toFixed(1) }}%</p>
              <p><strong>Camera Source:</strong> {{ lastCaptureResult.cameraSource }}</p>
              <p><strong>Location:</strong> {{ lastCaptureResult.location || 'Unknown' }}</p>
              <p><strong>Timestamp:</strong> {{ lastCaptureResult.capturedAt | date:'medium' }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .camera-controls {
      margin-bottom: 20px;
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .camera-container {
      position: relative;
      width: 100%;
      max-width: 640px;
      margin: 20px auto;
    }

    .camera-video {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .face-detection-info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
    }

    .capture-result {
      margin-top: 20px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .result-details p {
      margin: 8px 0;
    }

    .success {
      color: #4caf50;
      font-weight: bold;
    }

    .info {
      color: #2196f3;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .button-group {
        flex-direction: column;
      }
      
      .button-group button {
        width: 100%;
      }
    }
  `]
})
export class FaceCaptureComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  isCameraActive = false;
  isLoading = false;
  selectedCameraSource = 'browser';
  detectedFaces: any[] = [];
  maxConfidence = 0;
  lastCaptureResult: any = null;
  private stream: MediaStream | null = null;
  private detectionInterval: any = null;

  constructor(
    private faceRecognitionService: FaceRecognitionService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    await this.loadFaceApiModels();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  private async loadFaceApiModels() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/face-api-weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/face-api-weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/face-api-weights');
      console.log('Face API models loaded successfully');
    } catch (error) {
      console.error('Error loading Face API models:', error);
      this.snackBar.open('Error loading face detection models', 'Close', { duration: 3000 });
    }
  }

  async startCamera() {
    try {
      this.isLoading = true;
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.nativeElement.srcObject = this.stream;
      
      this.videoElement.nativeElement.onloadedmetadata = () => {
        this.isCameraActive = true;
        this.startFaceDetection();
      };

    } catch (error) {
      console.error('Error accessing camera:', error);
      this.snackBar.open('Error accessing camera. Please check permissions.', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    this.isCameraActive = false;
    this.detectedFaces = [];
    this.maxConfidence = 0;
  }

  private startFaceDetection() {
    this.detectionInterval = setInterval(async () => {
      if (this.videoElement.nativeElement.readyState === 4) {
        try {
          const detections = await this.faceRecognitionService.detectFaces(this.videoElement.nativeElement);
          this.detectedFaces = detections;
          
          if (detections.length > 0) {
            this.maxConfidence = Math.max(...detections.map(d => d.score));
            this.drawFaceDetections(detections);
          } else {
            this.clearCanvas();
          }
        } catch (error) {
          console.error('Error detecting faces:', error);
        }
      }
    }, 100);
  }

  private drawFaceDetections(detections: any[]) {
    const canvas = this.canvasElement.nativeElement;
    const video = this.videoElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      detections.forEach(detection => {
        const { box } = detection;
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw confidence score
        ctx.fillStyle = '#4CAF50';
        ctx.font = '16px Arial';
        ctx.fillText(`${(detection.score * 100).toFixed(1)}%`, box.x, box.y - 5);
      });
    }
  }

  private clearCanvas() {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  async captureFace() {
    if (!this.isCameraActive || this.detectedFaces.length === 0) {
      this.snackBar.open('No face detected. Please ensure a face is visible.', 'Close', { duration: 3000 });
      return;
    }

    try {
      this.isLoading = true;
      
      // Get current location
      const location = await this.faceRecognitionService.getCurrentLocation();
      
      // Capture image from video
      const faceImage = this.faceRecognitionService.captureImageFromVideo(this.videoElement.nativeElement);
      
      // Generate face encoding
      const faceEncoding = await this.faceRecognitionService.generateFaceEncoding(this.videoElement.nativeElement);
      
      const captureData: FaceCaptureRequest = {
        faceImage: faceImage,
        faceEncoding: faceEncoding || undefined,
        confidence: this.maxConfidence,
        cameraSource: this.selectedCameraSource,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location: location?.location
      };

      this.faceRecognitionService.captureAndMatchFace(captureData).subscribe({
        next: (response) => {
          if (response.success) {
            this.lastCaptureResult = response.data;
            const message = response.data.isMatched ? 
              'Face captured and matched successfully!' : 
              'Face captured successfully, no match found.';
            this.snackBar.open(message, 'Close', { duration: 3000 });
          } else {
            this.snackBar.open(response.message || 'Face capture failed', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error capturing face:', error);
          this.snackBar.open('Error capturing face. Please try again.', 'Close', { duration: 3000 });
        },
        complete: () => {
          this.isLoading = false;
        }
      });

    } catch (error) {
      console.error('Error in face capture:', error);
      this.snackBar.open('Error capturing face. Please try again.', 'Close', { duration: 3000 });
      this.isLoading = false;
    }
  }
}