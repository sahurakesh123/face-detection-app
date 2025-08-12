import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-image-test',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <mat-card class="debug-card">
      <mat-card-header>
        <mat-card-title>Image Capture Debug</mat-card-title>
        <mat-card-subtitle>Test image capture and upload</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="camera-container">
          <video #video 
                 [width]="400" 
                 [height]="300" 
                 autoplay 
                 [hidden]="!cameraStarted"></video>
          
          <canvas #canvas 
                  [width]="400" 
                  [height]="300" 
                  style="display: none;"></canvas>
          
          <div class="placeholder" *ngIf="!cameraStarted">
            <mat-icon>videocam_off</mat-icon>
            <p>Camera not started</p>
          </div>
          
          <div *ngIf="capturedImage" class="captured-container">
            <h3>Captured Image Preview</h3>
            <img [src]="capturedImage" alt="Captured image" class="captured-image"/>
            <p>Image size: {{ imageSize | number }} bytes</p>
          </div>

          <div *ngIf="capturedImageBase64" class="captured-container">
            <h3>Post-Conversion Debug Image (Base64)</h3>
            <img [src]="capturedImageBase64" alt="Base64 Debug image" class="captured-image"/>
            <p>This image shows exactly what is being prepared for upload.</p>
          </div>
        </div>
        
        <div class="controls">
          <button mat-raised-button 
                  color="primary" 
                  (click)="startCamera()" 
                  *ngIf="!cameraStarted">
            <mat-icon>videocam</mat-icon> Start Camera
          </button>
          
          <button mat-raised-button 
                  color="accent" 
                  (click)="captureImage()" 
                  *ngIf="cameraStarted">
            <mat-icon>camera</mat-icon> Capture
          </button>
          
          <button mat-raised-button 
                  color="warn" 
                  (click)="stopCamera()" 
                  *ngIf="cameraStarted">
            <mat-icon>videocam_off</mat-icon> Stop Camera
          </button>
        </div>
        
        <div class="upload-controls" *ngIf="capturedImage">
          <button mat-raised-button 
                  color="primary" 
                  (click)="uploadImage()">
            <mat-icon>cloud_upload</mat-icon> Upload to Test Endpoint
          </button>
          
          <button mat-raised-button 
                  (click)="downloadImage()">
            <mat-icon>download</mat-icon> Download Image
          </button>
        </div>
        
        <div class="debug-options">
          <h3>Debug Options</h3>
          
          <mat-form-field appearance="outline">
            <mat-label>Quality (0.1-1.0)</mat-label>
            <input matInput [(ngModel)]="imageQuality" type="number" min="0.1" max="1.0" step="0.05">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Format</mat-label>
            <input matInput [(ngModel)]="imageFormat">
          </mat-form-field>
        </div>
        
        <div *ngIf="serverResponse" class="server-response">
          <h3>Server Response</h3>
          <pre>{{ serverResponse | json }}</pre>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .debug-card {
      max-width: 800px;
      margin: 20px auto;
    }
    
    .camera-container {
      background: #f5f5f5;
      border: 1px solid #ddd;
      padding: 10px;
      text-align: center;
      margin-bottom: 15px;
    }
    
    .placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #777;
    }
    
    .placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    
    .controls, .upload-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .captured-container {
      margin: 15px 0;
    }
    
    .captured-image {
      max-width: 100%;
      border: 1px solid #ddd;
    }
    
    .debug-options {
      margin: 15px 0;
      padding: 15px;
      background: #f9f9f9;
      border: 1px solid #eee;
    }
    
    .server-response {
      background: #f0f8ff;
      padding: 15px;
      border: 1px solid #c8e1ff;
      margin-top: 15px;
      overflow: auto;
    }
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  `]
})
export class ImageTestComponent {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  cameraStarted = false;
  capturedImage: string | null = null;
  capturedImageBase64: string | null = null; // For debugging
  imageBlob: Blob | null = null;
  imageSize = 0;
  mediaStream: MediaStream | null = null;
  
  // Debug options
  imageQuality = 0.95;
  imageFormat = 'image/jpeg';
  
  serverResponse: any = null;
  
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}
  
  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
        this.cameraStarted = true;
        this.snackBar.open('Camera started', 'Close', { duration: 2000 });
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      this.snackBar.open('Failed to start camera', 'Close', { duration: 3000 });
    }
  }
  
  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.cameraStarted = false;
    this.snackBar.open('Camera stopped', 'Close', { duration: 2000 });
  }
  
  captureImage() {
    if (!this.cameraStarted || !this.videoElement || !this.canvasElement) {
      this.snackBar.open('Camera not ready', 'Close', { duration: 2000 });
      return;
    }
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    
    if (!context) {
      this.snackBar.open('Could not get canvas context', 'Close', { duration: 3000 });
      return;
    }
    
    // Set canvas dimensions to match video
    const width = video.videoWidth || 400;
    const height = video.videoHeight || 300;
    canvas.width = width;
    canvas.height = height;
    
    console.log(`Capturing image at ${width}x${height}`);
    
    // Try different capture approaches
    
    // 1. Fill with white background first (helps detect failures)
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    // 2. Draw video frame to canvas
    context.drawImage(video, 0, 0, width, height);
    
    // 3. Convert to data URL
    this.capturedImage = canvas.toDataURL(this.imageFormat, this.imageQuality);
    
    // 4. Create blob
    canvas.toBlob(blob => {
      if (blob) {
        this.imageBlob = blob;
        this.imageSize = blob.size;
        console.log(`Created image blob: ${blob.size} bytes, type: ${blob.type}`);
        
        // --- Frontend Debugging Step ---
        // Read the blob back to a Base64 string to verify its content before upload.
        const reader = new FileReader();
        reader.onload = (e) => {
          this.capturedImageBase64 = e.target?.result as string;
          console.log('--- Verifying Frontend Image Data ---');
          console.log('Base64 Data URL:', this.capturedImageBase64);
        };
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
        };
        reader.readAsDataURL(blob);
        // --- End of Debugging Step ---

        // Log image content for debugging
        const reader2 = new FileReader();
        reader2.onload = () => {
          const arr = new Uint8Array(reader2.result as ArrayBuffer);
          let hexString = '';
          for (let i = 0; i < Math.min(50, arr.length); i++) {
            hexString += arr[i].toString(16).padStart(2, '0') + ' ';
          }
          console.log('Image hex data (first 50 bytes):', hexString);
        };
        reader2.readAsArrayBuffer(blob);
        
        this.snackBar.open(`Image captured: ${Math.round(blob.size/1024)}KB`, 'Close', { duration: 2000 });
      } else {
        console.error('Failed to create blob');
        this.snackBar.open('Failed to capture image', 'Close', { duration: 3000 });
      }
    }, this.imageFormat, this.imageQuality);
  }

  uploadImage() {
    if (!this.capturedImageBase64) {
      this.snackBar.open('No image captured or processed', 'Close', { duration: 3000 });
      return;
    }

    this.serverResponse = null;

    const payload = {
      image: this.capturedImageBase64,
      latitude: null,
      longitude: null,
      cameraId: 'debug-cam',
      locationAddress: 'Debug Location'
    };

    this.http.post('/api/face/detect', payload)
      .subscribe({
        next: (response) => {
          this.serverResponse = response;
          this.snackBar.open('Upload successful!', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Upload error', err);
          this.serverResponse = err.error || { message: 'An unknown error occurred' };
          this.snackBar.open(`Upload failed: ${err.message}`, 'Close', { duration: 5000 });
        }
      });
  }

  downloadImage() {
    if (!this.capturedImage) {
      this.snackBar.open('No image to download', 'Close', { duration: 2000 });
      return;
    }
    
    // Create temporary link for download
    const link = document.createElement('a');
    link.href = this.capturedImage;
    link.download = `test-image-${Date.now()}.jpg`;
    link.click();
    
    this.snackBar.open('Image downloaded', 'Close', { duration: 2000 });
  }
}
