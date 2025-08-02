import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { FaceRecognitionService, FaceData } from '../../services/face-recognition.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <h1>Profile & Settings</h1>

      <mat-tab-group>
        <!-- Profile Information Tab -->
        <mat-tab label="Profile Information">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Personal Information</mat-card-title>
                <mat-card-subtitle>Update your profile details</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>First Name</mat-label>
                      <input matInput formControlName="firstName">
                      <mat-icon matSuffix>person</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="half-width">
                      <mat-label>Last Name</mat-label>
                      <input matInput formControlName="lastName">
                      <mat-icon matSuffix>person</mat-icon>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" readonly>
                    <mat-icon matSuffix>email</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phoneNumber">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>

                  <div class="form-actions">
                    <button 
                      mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="profileForm.invalid || isUpdating">
                      <mat-icon>save</mat-icon>
                      Update Profile
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Security Tab -->
        <mat-tab label="Security">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Change Password</mat-card-title>
                <mat-card-subtitle>Update your account password</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Current Password</mat-label>
                    <input matInput type="password" formControlName="currentPassword">
                    <mat-icon matSuffix>lock</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>New Password</mat-label>
                    <input matInput type="password" formControlName="newPassword">
                    <mat-icon matSuffix>lock_outline</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Confirm New Password</mat-label>
                    <input matInput type="password" formControlName="confirmPassword">
                    <mat-icon matSuffix>lock_outline</mat-icon>
                  </mat-form-field>

                  <div class="form-actions">
                    <button 
                      mat-raised-button 
                      color="warn" 
                      type="submit"
                      [disabled]="passwordForm.invalid || isChangingPassword">
                      <mat-icon>security</mat-icon>
                      Change Password
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Face Data Tab -->
        <mat-tab label="Face Data">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>My Face Captures</mat-card-title>
                <mat-card-subtitle>View and manage your face recognition data</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="face-data-stats">
                  <div class="stat-item">
                    <h3>Total Captures</h3>
                    <p class="stat-number">{{ totalCaptures }}</p>
                  </div>
                  <div class="stat-item">
                    <h3>Successful Matches</h3>
                    <p class="stat-number">{{ successfulMatches }}</p>
                  </div>
                  <div class="stat-item">
                    <h3>Average Confidence</h3>
                    <p class="stat-number">{{ averageConfidence }}%</p>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <div class="face-captures-list">
                  <h3>Recent Captures</h3>
                  <mat-list>
                    <mat-list-item *ngFor="let capture of recentCaptures" class="capture-item">
                      <mat-icon matListItemIcon>face</mat-icon>
                      <div matListItemTitle>
                        {{ capture.isMatched ? 'Match Found' : 'No Match' }}
                        <mat-chip [color]="capture.isMatched ? 'accent' : 'primary'" selected>
                          {{ (capture.confidence * 100).toFixed(1) }}%
                        </mat-chip>
                      </div>
                      <div matListItemLine>
                        {{ capture.cameraSource | titlecase }} • {{ capture.location || 'Unknown location' }}
                      </div>
                      <div matListItemMeta>
                        {{ capture.capturedAt | date:'short' }}
                      </div>
                    </mat-list-item>

                    <mat-list-item *ngIf="recentCaptures.length === 0">
                      <div matListItemTitle>No face captures yet</div>
                      <div matListItemLine>Start by capturing your face in the Face Capture section</div>
                    </mat-list-item>
                  </mat-list>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Notifications Tab -->
        <mat-tab label="Notifications">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Notification Settings</mat-card-title>
                <mat-card-subtitle>Configure how you receive notifications</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="notification-settings">
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Email Notifications</h4>
                      <p>Receive email alerts when your face is matched</p>
                    </div>
                    <mat-chip color="accent" selected>Enabled</mat-chip>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>SMS Notifications</h4>
                      <p>Receive SMS alerts when your face is matched</p>
                    </div>
                    <mat-chip color="primary" selected>Disabled</mat-chip>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Location Tracking</h4>
                      <p>Include location data in notifications</p>
                    </div>
                    <mat-chip color="accent" selected>Enabled</mat-chip>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Real-time Alerts</h4>
                      <p>Receive immediate notifications for matches</p>
                    </div>
                    <mat-chip color="accent" selected>Enabled</mat-chip>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .half-width {
      flex: 1;
    }

    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }

    .form-actions {
      margin-top: 20px;
    }

    .face-data-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-item {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }

    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #2196f3;
      margin: 0;
    }

    .face-captures-list {
      margin-top: 20px;
    }

    .face-captures-list h3 {
      margin-bottom: 15px;
      color: #333;
    }

    .capture-item {
      border-bottom: 1px solid #eee;
    }

    .capture-item:last-child {
      border-bottom: none;
    }

    .notification-settings {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .setting-info h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .setting-info p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .face-data-stats {
        grid-template-columns: 1fr;
      }

      .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isUpdating = false;
  isChangingPassword = false;
  currentUser: any = null;
  totalCaptures = 0;
  successfulMatches = 0;
  averageConfidence = 0;
  recentCaptures: FaceData[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private faceRecognitionService: FaceRecognitionService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadFaceData();
  }

  private loadUserProfile() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phoneNumber: this.currentUser.phoneNumber || ''
      });
    }
  }

  private loadFaceData() {
    this.faceRecognitionService.getMyFaceData().subscribe({
      next: (response) => {
        if (response.success) {
          this.recentCaptures = response.data.slice(0, 10);
          this.totalCaptures = response.data.length;
          this.successfulMatches = response.data.filter(capture => capture.isMatched).length;
          
          if (response.data.length > 0) {
            const totalConfidence = response.data.reduce((sum, capture) => sum + capture.confidence, 0);
            this.averageConfidence = Math.round((totalConfidence / response.data.length) * 100);
          }
        }
      },
      error: (error) => {
        console.error('Error loading face data:', error);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.isUpdating = true;
      
      // In a real application, you would call an API to update the profile
      setTimeout(() => {
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
        this.isUpdating = false;
      }, 1000);
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      this.isChangingPassword = true;
      
      // In a real application, you would call an API to change the password
      setTimeout(() => {
        this.snackBar.open('Password changed successfully!', 'Close', { duration: 3000 });
        this.passwordForm.reset();
        this.isChangingPassword = false;
      }, 1000);
    }
  }
}