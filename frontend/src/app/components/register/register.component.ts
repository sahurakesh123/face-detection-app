import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <mat-card class="registration-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person_add</mat-icon>
                Register New Person
              </mat-card-title>
              <mat-card-subtitle>
                Fill in the details and capture a face photo for registration
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <div class="row">
                  <!-- Personal Information -->
                  <div class="col-md-6">
                    <h4>Personal Information</h4>
                    
                    <mat-form-field appearance="outline">
                      <mat-label>First Name</mat-label>
                      <input matInput formControlName="firstName" required>
                      <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                        First name is required
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Last Name</mat-label>
                      <input matInput formControlName="lastName" required>
                      <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                        Last name is required
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" formControlName="email" required>
                      <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                        Email is required
                      </mat-error>
                      <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                        Please enter a valid email
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Phone Number</mat-label>
                      <input matInput formControlName="phoneNumber">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Address</mat-label>
                      <textarea matInput rows="3" formControlName="address"></textarea>
                    </mat-form-field>
                  </div>

                  <!-- Face Capture -->
                  <div class="col-md-6">
                    <h4>Face Capture</h4>
                    
                    <div class="camera-section">
                      <div class="camera-container" *ngIf="!capturedImage">
                        <video #videoElement autoplay muted [style.width.px]="320" [style.height.px]="240"></video>
                        <canvas #canvasElement [width]="320" [height]="240" style="display: none;"></canvas>
                      </div>

                      <div class="captured-image" *ngIf="capturedImage">
                        <img [src]="capturedImage" alt="Captured face" class="img-fluid">
                      </div>

                      <div class="camera-controls mt-3">
                        <button type="button" mat-raised-button color="primary" 
                                (click)="startCamera()" *ngIf="!cameraActive" class="me-2">
                          <mat-icon>camera_alt</mat-icon>
                          Start Camera
                        </button>

                        <button type="button" mat-raised-button color="accent" 
                                (click)="capturePhoto()" *ngIf="cameraActive && !capturedImage" class="me-2">
                          <mat-icon>camera</mat-icon>
                          Capture Photo
                        </button>

                        <button type="button" mat-raised-button color="warn" 
                                (click)="retakePhoto()" *ngIf="capturedImage" class="me-2">
                          <mat-icon>refresh</mat-icon>
                          Retake Photo
                        </button>

                        <button type="button" mat-button (click)="stopCamera()" *ngIf="cameraActive">
                          <mat-icon>stop</mat-icon>
                          Stop Camera
                        </button>
                      </div>

                      <div class="alert alert-info mt-3" *ngIf="!capturedImage">
                        <mat-icon>info</mat-icon>
                        Please capture a clear photo of your face for registration
                      </div>
                    </div>
                  </div>
                </div>

                <mat-card-actions class="mt-4">
                  <button type="submit" mat-raised-button color="primary" 
                          [disabled]="registerForm.invalid || !capturedImage || isLoading"
                          class="btn-register me-2">
                    <mat-spinner diameter="20" *ngIf="isLoading" class="me-2"></mat-spinner>
                    <mat-icon *ngIf="!isLoading">person_add</mat-icon>
                    {{ isLoading ? 'Registering...' : 'Register Person' }}
                  </button>

                  <button type="button" mat-button (click)="resetForm()">
                    <mat-icon>clear</mat-icon>
                    Reset Form
                  </button>
                </mat-card-actions>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .registration-card {
      margin: 2rem 0;
      padding: 2rem;
    }

    .camera-section {
      border: 2px dashed #ddd;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      background-color: #fafafa;
    }

    .camera-container {
      background: #000;
      border-radius: 8px;
      display: inline-block;
      overflow: hidden;
    }

    .captured-image img {
      max-width: 320px;
      height: auto;
      border-radius: 8px;
    }

    .camera-controls {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }

    h4 {
      color: #3f51b5;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .alert-info {
      background-color: #e3f2fd;
      color: #1976d2;
      border: 1px solid #bbdefb;
    }

    @media (max-width: 768px) {
      .registration-card {
        margin: 1rem;
        padding: 1rem;
      }
      
      .camera-controls {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  registerForm: FormGroup;
  cameraActive = false;
  capturedImage: string | null = null;
  capturedBlob: Blob | null = null;
  isLoading = false;
  mediaStream: MediaStream | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: ['']
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
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

  capturePhoto() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(video, 0, 0, 320, 240);
      canvas.toBlob((blob) => {
        if (blob) {
          this.capturedBlob = blob;
          this.capturedImage = URL.createObjectURL(blob);
          this.stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  }

  retakePhoto() {
    this.capturedImage = null;
    this.capturedBlob = null;
    this.startCamera();
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive = false;
  }

  onSubmit() {
    if (this.registerForm.valid && this.capturedBlob) {
      this.isLoading = true;

      const formData = new FormData();
      formData.append('firstName', this.registerForm.get('firstName')?.value);
      formData.append('lastName', this.registerForm.get('lastName')?.value);
      formData.append('email', this.registerForm.get('email')?.value);
      
      if (this.registerForm.get('phoneNumber')?.value) {
        formData.append('phoneNumber', this.registerForm.get('phoneNumber')?.value);
      }
      
      if (this.registerForm.get('address')?.value) {
        formData.append('address', this.registerForm.get('address')?.value);
      }
      
      formData.append('faceImage', this.capturedBlob, 'face.jpg');

      this.apiService.registerPerson(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Person registered successfully!', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.resetForm();
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.error?.message || 'Registration failed. Please try again.';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  resetForm() {
    this.registerForm.reset();
    this.capturedImage = null;
    this.capturedBlob = null;
    this.stopCamera();
  }
}