import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { Person } from '../../models/person.model';
import { DetectionLog } from '../../models/detection.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <!-- Welcome Section -->
      <div class="welcome-section mb-4">
        <h1>Face Recognition System</h1>
        <p class="lead">Advanced facial recognition with real-time detection and notifications</p>
      </div>

      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-content">
                <h3>{{ totalPersons }}</h3>
                <p>Registered Persons</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-3">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon detection">
                <mat-icon>search</mat-icon>
              </div>
              <div class="stat-content">
                <h3>{{ totalDetections }}</h3>
                <p>Total Detections</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-3">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon success">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-content">
                <h3>{{ successfulMatches }}</h3>
                <p>Successful Matches</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-3">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon notification">
                <mat-icon>notifications</mat-icon>
              </div>
              <div class="stat-content">
                <h3>{{ notificationsSent }}</h3>
                <p>Notifications Sent</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row mb-4">
        <div class="col-md-6">
          <mat-card class="action-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>flash_on</mat-icon>
                Quick Actions
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="action-buttons">
                <button mat-raised-button color="primary" routerLink="/detect" class="action-btn">
                  <mat-icon>camera_alt</mat-icon>
                  Start Face Detection
                </button>
                
                <button mat-raised-button color="accent" routerLink="/register" class="action-btn">
                  <mat-icon>person_add</mat-icon>
                  Register New Person
                </button>
                
                <button mat-raised-button routerLink="/persons" class="action-btn">
                  <mat-icon>people</mat-icon>
                  View All Persons
                </button>
                
                <button mat-raised-button routerLink="/detections" class="action-btn">
                  <mat-icon>history</mat-icon>
                  Detection History
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-6">
          <mat-card class="recent-activity-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>history</mat-icon>
                Recent Activity
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="isLoading" class="loading-spinner">
                <mat-spinner diameter="50"></mat-spinner>
              </div>

              <div *ngIf="!isLoading && recentDetections.length === 0" class="no-activity">
                <mat-icon>info</mat-icon>
                <p>No recent detections</p>
              </div>

              <div *ngIf="!isLoading && recentDetections.length > 0" class="activity-list">
                <div *ngFor="let detection of recentDetections" class="activity-item">
                  <div class="activity-icon">
                    <mat-icon [class]="detection.person ? 'success' : 'warning'">
                      {{ detection.person ? 'check_circle' : 'warning' }}
                    </mat-icon>
                  </div>
                  <div class="activity-details">
                    <p class="activity-title">
                      {{ detection.person ? 
                          (detection.person.firstName + ' ' + detection.person.lastName) : 
                          'Unknown Person' }}
                    </p>
                    <p class="activity-time">{{ detection.detectionTime | date:'short' }}</p>
                  </div>
                  <div class="activity-confidence">
                    <span class="confidence-badge">
                      {{ (detection.confidenceScore * 100) | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Features Overview -->
      <div class="row">
        <div class="col-12">
          <mat-card class="features-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>featured_play_list</mat-icon>
                System Features
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="features-grid">
                <div class="feature-item">
                  <mat-icon>camera_alt</mat-icon>
                  <h5>Live Camera Detection</h5>
                  <p>Real-time face detection from webcam, CCTV, or any camera source</p>
                </div>
                
                <div class="feature-item">
                  <mat-icon>face</mat-icon>
                  <h5>Face Matching</h5>
                  <p>Advanced facial recognition with high accuracy matching algorithms</p>
                </div>
                
                <div class="feature-item">
                  <mat-icon>email</mat-icon>
                  <h5>Email Notifications</h5>
                  <p>Instant email alerts with person details and location information</p>
                </div>
                
                <div class="feature-item">
                  <mat-icon>sms</mat-icon>
                  <h5>SMS Alerts</h5>
                  <p>SMS notifications for immediate alerts on registered phone numbers</p>
                </div>
                
                <div class="feature-item">
                  <mat-icon>location_on</mat-icon>
                  <h5>Location Tracking</h5>
                  <p>GPS coordinates and address information for each detection event</p>
                </div>
                
                <div class="feature-item">
                  <mat-icon>security</mat-icon>
                  <h5>Secure Storage</h5>
                  <p>Encrypted storage of personal data and face recognition templates</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-section {
      text-align: center;
      padding: 2rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .welcome-section h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
    }

    .stat-card {
      height: 120px;
      position: relative;
      overflow: hidden;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      color: #3f51b5;
      margin-right: 1rem;
    }

    .stat-icon mat-icon {
      font-size: 2.5rem;
      height: 2.5rem;
      width: 2.5rem;
    }

    .stat-icon.detection {
      color: #ff9800;
    }

    .stat-icon.success {
      color: #4caf50;
    }

    .stat-icon.notification {
      color: #e91e63;
    }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: 500;
      margin: 0;
      color: #333;
    }

    .stat-content p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .action-card, .recent-activity-card, .features-card {
      height: 100%;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      gap: 0.5rem;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }

    .no-activity {
      text-align: center;
      color: #999;
      padding: 2rem;
    }

    .no-activity mat-icon {
      font-size: 3rem;
      height: 3rem;
      width: 3rem;
      margin-bottom: 1rem;
    }

    .activity-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      margin-right: 1rem;
    }

    .activity-icon mat-icon.success {
      color: #4caf50;
    }

    .activity-icon mat-icon.warning {
      color: #ff9800;
    }

    .activity-details {
      flex: 1;
    }

    .activity-title {
      margin: 0;
      font-weight: 500;
      color: #333;
    }

    .activity-time {
      margin: 0;
      font-size: 0.8rem;
      color: #666;
    }

    .confidence-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }

    .feature-item {
      text-align: center;
      padding: 1rem;
    }

    .feature-item mat-icon {
      font-size: 3rem;
      height: 3rem;
      width: 3rem;
      color: #3f51b5;
      margin-bottom: 1rem;
    }

    .feature-item h5 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .feature-item p {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .welcome-section h1 {
        font-size: 2rem;
      }
      
      .action-buttons {
        grid-template-columns: 1fr;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  totalPersons = 0;
  totalDetections = 0;
  successfulMatches = 0;
  notificationsSent = 0;
  recentDetections: DetectionLog[] = [];
  isLoading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Load persons count
    this.apiService.getAllPersons().subscribe({
      next: (persons) => {
        this.totalPersons = persons.length;
      },
      error: (error) => console.error('Error loading persons:', error)
    });

    // Load recent detections
    this.apiService.getRecentDetections(5).subscribe({
      next: (detections) => {
        this.recentDetections = detections;
        this.totalDetections = detections.length;
        this.successfulMatches = detections.filter(d => d.person).length;
        this.notificationsSent = detections.filter(d => d.notificationSent).length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading detections:', error);
        this.isLoading = false;
      }
    });
  }
}