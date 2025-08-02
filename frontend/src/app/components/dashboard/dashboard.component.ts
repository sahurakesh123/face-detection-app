import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FaceDetectionService, DetectionStats, FaceDetection } from '../../services/face-detection.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Welcome, {{ currentUser?.firstName }}!</h1>
        <p>Face Recognition System Dashboard</p>
      </div>

      <div class="stats-grid" *ngIf="!isLoading">
        <mat-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats?.totalUsers || 0 }}</div>
              <div class="stats-label">Total Users</div>
            </div>
          </div>
        </mat-card>

        <mat-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">
              <mat-icon>face</mat-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats?.usersWithFaces || 0 }}</div>
              <div class="stats-label">Registered Faces</div>
            </div>
          </div>
        </mat-card>

        <mat-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">
              <mat-icon>camera_alt</mat-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats?.totalDetections || 0 }}</div>
              <div class="stats-label">Total Detections</div>
            </div>
          </div>
        </mat-card>

        <mat-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">
              <mat-icon>today</mat-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats?.detectionsToday || 0 }}</div>
              <div class="stats-label">Today's Detections</div>
            </div>
          </div>
        </mat-card>
      </div>

      <div class="loading-section" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading dashboard data...</p>
      </div>

      <div class="action-cards">
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>videocam</mat-icon>
              Face Detection
            </mat-card-title>
            <mat-card-subtitle>Start live face detection</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Capture faces from your camera and detect matches in real-time.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/face-detection">
              <mat-icon>play_arrow</mat-icon>
              Start Detection
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="action-card" *ngIf="!currentUser?.faceEncoding">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>face</mat-icon>
              Register Face
            </mat-card-title>
            <mat-card-subtitle>Add your face to the system</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Register your face to enable detection and notifications.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="accent" routerLink="/face-registration">
              <mat-icon>add</mat-icon>
              Register Face
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Detection History
            </mat-card-title>
            <mat-card-subtitle>View recent detections</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Check your detection history and notifications.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/detections">
              <mat-icon>visibility</mat-icon>
              View History
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="recent-detections" *ngIf="recentDetections.length > 0">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Detections</mat-card-title>
            <mat-card-subtitle>Latest face detection events</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let detection of recentDetections" class="detection-item">
                <div matListItemIcon>
                  <mat-icon [ngClass]="detection.status === 'DETECTED' ? 'detected' : 'unknown'">
                    {{ detection.status === 'DETECTED' ? 'check_circle' : 'help' }}
                  </mat-icon>
                </div>
                <div matListItemTitle>
                  {{ detection.user.firstName }} {{ detection.user.lastName }}
                </div>
                <div matListItemLine>
                  <span class="detection-time">{{ detection.detectedAt | date:'medium' }}</span>
                  <mat-chip color="primary" selected class="confidence-chip">
                    {{ detection.confidenceScore * 100 | number:'1.0-1' }}%
                  </mat-chip>
                </div>
                <div matListItemMeta>
                  <mat-chip *ngIf="detection.cameraLocation" color="accent" selected>
                    {{ detection.cameraLocation }}
                  </mat-chip>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="admin-section" *ngIf="authService.isAdmin()">
        <mat-card class="admin-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>admin_panel_settings</mat-icon>
              Admin Panel
            </mat-card-title>
            <mat-card-subtitle>System administration tools</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Access admin features for user management and system monitoring.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="warn" routerLink="/admin">
              <mat-icon>settings</mat-icon>
              Admin Panel
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .dashboard-header h1 {
      color: #3f51b5;
      margin-bottom: 8px;
      font-size: 2.5rem;
    }

    .dashboard-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stats-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .stats-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stats-icon mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
    }

    .stats-number {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .stats-label {
      font-size: 1rem;
      opacity: 0.9;
    }

    .action-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .action-card {
      border-radius: 12px;
      overflow: hidden;
    }

    .action-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #3f51b5;
    }

    .recent-detections {
      margin-bottom: 30px;
    }

    .detection-item {
      border-bottom: 1px solid #eee;
    }

    .detection-item:last-child {
      border-bottom: none;
    }

    .detection-time {
      color: #666;
      font-size: 0.9rem;
    }

    .confidence-chip {
      margin-left: 10px;
    }

    .detected {
      color: #4caf50;
    }

    .unknown {
      color: #ff9800;
    }

    .admin-section {
      margin-top: 30px;
    }

    .admin-card {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      border-radius: 12px;
    }

    .admin-card mat-card-title {
      color: white;
    }

    .loading-section {
      text-align: center;
      padding: 40px;
    }

    .loading-section p {
      margin-top: 16px;
      color: #666;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      
      .action-cards {
        grid-template-columns: 1fr;
      }
      
      .dashboard-header h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  stats: DetectionStats | null = null;
  recentDetections: FaceDetection[] = [];
  isLoading = true;

  constructor(
    private faceDetectionService: FaceDetectionService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    // Load statistics
    this.faceDetectionService.getDetectionStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load dashboard data', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });

    // Load recent detections
    this.faceDetectionService.getRecentDetections(5).subscribe({
      next: (detections) => {
        this.recentDetections = detections;
      },
      error: (error) => {
        console.error('Error loading recent detections:', error);
      }
    });
  }
}