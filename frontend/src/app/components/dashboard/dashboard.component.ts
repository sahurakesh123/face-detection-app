import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { FaceRecognitionService, FaceData } from '../../services/face-recognition.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatChipsModule
  ],
  template: `
    <div class="container">
      <h1>Dashboard</h1>
      
      <div class="welcome-section">
        <mat-card class="welcome-card">
          <mat-card-content>
            <h2>Welcome, {{ currentUser?.firstName || 'User' }}!</h2>
            <p>Face Recognition System Dashboard</p>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">face</mat-icon>
              <div class="stat-info">
                <h3>{{ totalCaptures }}</h3>
                <p>Total Captures</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon success">check_circle</mat-icon>
              <div class="stat-info">
                <h3>{{ totalMatches }}</h3>
                <p>Successful Matches</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon warning">camera_alt</mat-icon>
              <div class="stat-info">
                <h3>{{ activeCameras }}</h3>
                <p>Active Cameras</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon info">notifications</mat-icon>
              <div class="stat-info">
                <h3>{{ notificationsSent }}</h3>
                <p>Notifications Sent</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="quick-actions">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" routerLink="/face-capture">
                <mat-icon>camera_alt</mat-icon>
                Capture Face
              </button>
              <button mat-raised-button color="accent" routerLink="/matches">
                <mat-icon>face</mat-icon>
                View Matches
              </button>
              <button mat-raised-button color="warn" routerLink="/profile">
                <mat-icon>person</mat-icon>
                Profile Settings
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="recent-activity">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Activity</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let match of recentMatches" class="activity-item">
                <mat-icon matListItemIcon [class]="match.isMatched ? 'success' : 'info'">
                  {{ match.isMatched ? 'check_circle' : 'face' }}
                </mat-icon>
                <div matListItemTitle>
                  {{ match.isMatched ? 'Face Match Detected' : 'Face Captured' }}
                </div>
                <div matListItemLine>
                  {{ match.cameraSource | titlecase }} • {{ match.location || 'Unknown location' }}
                </div>
                <div matListItemMeta>
                  <mat-chip [color]="match.isMatched ? 'accent' : 'primary'" selected>
                    {{ (match.confidence * 100).toFixed(1) }}%
                  </mat-chip>
                </div>
              </mat-list-item>
              
              <mat-list-item *ngIf="recentMatches.length === 0">
                <div matListItemTitle>No recent activity</div>
                <div matListItemLine>Start by capturing a face to see activity here</div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="system-status">
        <mat-card>
          <mat-card-header>
            <mat-card-title>System Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-grid">
              <div class="status-item">
                <mat-icon class="status-icon success">check_circle</mat-icon>
                <span>Face Detection</span>
                <mat-chip color="accent" selected>Active</mat-chip>
              </div>
              <div class="status-item">
                <mat-icon class="status-icon success">check_circle</mat-icon>
                <span>Database</span>
                <mat-chip color="accent" selected>Connected</mat-chip>
              </div>
              <div class="status-item">
                <mat-icon class="status-icon success">check_circle</mat-icon>
                <span>Email Service</span>
                <mat-chip color="accent" selected>Ready</mat-chip>
              </div>
              <div class="status-item">
                <mat-icon class="status-icon success">check_circle</mat-icon>
                <span>Location Services</span>
                <mat-chip color="accent" selected>Available</mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .welcome-section {
      margin-bottom: 30px;
    }

    .welcome-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .welcome-card h2 {
      margin: 0;
      font-size: 24px;
    }

    .welcome-card p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-icon.success {
      color: #4caf50;
    }

    .stat-icon.warning {
      color: #ff9800;
    }

    .stat-icon.info {
      color: #2196f3;
    }

    .stat-info h3 {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }

    .stat-info p {
      margin: 5px 0 0 0;
      color: #666;
    }

    .quick-actions {
      margin-bottom: 30px;
    }

    .action-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .action-buttons button {
      flex: 1;
      min-width: 150px;
      height: 50px;
    }

    .recent-activity {
      margin-bottom: 30px;
    }

    .activity-item {
      border-bottom: 1px solid #eee;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .system-status {
      margin-bottom: 30px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .status-icon {
      font-size: 24px;
    }

    .status-icon.success {
      color: #4caf50;
    }

    .status-item span {
      flex: 1;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
      }

      .status-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  totalCaptures = 0;
  totalMatches = 0;
  activeCameras = 1;
  notificationsSent = 0;
  recentMatches: FaceData[] = [];

  constructor(
    private authService: AuthService,
    private faceRecognitionService: FaceRecognitionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load recent matches
    this.faceRecognitionService.getRecentMatches().subscribe({
      next: (response) => {
        if (response.success) {
          this.recentMatches = response.data.slice(0, 5); // Show last 5 matches
          this.totalMatches = response.data.filter(match => match.isMatched).length;
        }
      },
      error: (error) => {
        console.error('Error loading recent matches:', error);
      }
    });

    // Load user's face data for total captures
    this.faceRecognitionService.getMyFaceData().subscribe({
      next: (response) => {
        if (response.success) {
          this.totalCaptures = response.data.length;
        }
      },
      error: (error) => {
        console.error('Error loading face data:', error);
      }
    });

    // Mock data for demo purposes
    this.notificationsSent = Math.floor(Math.random() * 50) + 10;
  }
}