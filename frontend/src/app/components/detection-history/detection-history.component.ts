import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { DetectionLog } from '../../models/detection.model';

@Component({
  selector: 'app-detection-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <mat-card class="detections-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>history</mat-icon>
            Detection History
          </mat-card-title>
          <mat-card-subtitle>
            Complete log of all face detection events
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Summary Stats -->
          <div class="stats-row mb-4">
            <div class="stat-item">
              <h4>{{ detections.length }}</h4>
              <p>Total Detections</p>
            </div>
            <div class="stat-item">
              <h4>{{ getMatchedCount() }}</h4>
              <p>Successful Matches</p>
            </div>
            <div class="stat-item">
              <h4>{{ getNotificationCount() }}</h4>
              <p>Notifications Sent</p>
            </div>
          </div>

          <!-- Detections Table -->
          <div class="table-container">
            <table mat-table [dataSource]="detections" class="detections-table">
              <!-- Detection Time Column -->
              <ng-container matColumnDef="detectionTime">
                <th mat-header-cell *matHeaderCellDef>Detection Time</th>
                <td mat-cell *matCellDef="let detection">
                  <div class="detection-time">
                    {{ detection.detectionTime | date:'short' }}
                  </div>
                </td>
              </ng-container>

              <!-- Person Column -->
              <ng-container matColumnDef="person">
                <th mat-header-cell *matHeaderCellDef>Person</th>
                <td mat-cell *matCellDef="let detection">
                  <div class="person-info" *ngIf="detection.person">
                    <mat-icon class="match-icon success">check_circle</mat-icon>
                    <div class="person-details">
                      <strong>{{ detection.person.firstName }} {{ detection.person.lastName }}</strong>
                      <small>{{ detection.person.email }}</small>
                    </div>
                  </div>
                  <div class="person-info" *ngIf="!detection.person">
                    <mat-icon class="match-icon warning">warning</mat-icon>
                    <span class="unknown-person">Unknown Person</span>
                  </div>
                </td>
              </ng-container>

              <!-- Confidence Column -->
              <ng-container matColumnDef="confidence">
                <th mat-header-cell *matHeaderCellDef>Confidence</th>
                <td mat-cell *matCellDef="let detection">
                  <div class="confidence-container">
                    <div class="confidence-bar">
                      <div class="confidence-fill" [style.width.%]="(detection.confidenceScore * 100)"></div>
                    </div>
                    <span class="confidence-text">{{ (detection.confidenceScore * 100) | number:'1.0-0' }}%</span>
                  </div>
                </td>
              </ng-container>

              <!-- Location Column -->
              <ng-container matColumnDef="location">
                <th mat-header-cell *matHeaderCellDef>Location</th>
                <td mat-cell *matCellDef="let detection">
                  <div class="location-info" *ngIf="detection.latitude && detection.longitude">
                    <mat-icon class="location-icon">location_on</mat-icon>
                    <div class="location-details">
                      <div class="coordinates">
                        {{ detection.latitude | number:'1.4-4' }}, {{ detection.longitude | number:'1.4-4' }}
                      </div>
                      <div class="address" *ngIf="detection.locationAddress">
                        {{ detection.locationAddress }}
                      </div>
                    </div>
                  </div>
                  <span class="text-muted" *ngIf="!detection.latitude || !detection.longitude">
                    Location not available
                  </span>
                </td>
              </ng-container>

              <!-- Camera Column -->
              <ng-container matColumnDef="camera">
                <th mat-header-cell *matHeaderCellDef>Camera</th>
                <td mat-cell *matCellDef="let detection">
                  <div class="camera-info">
                    <div class="camera-id" *ngIf="detection.cameraId">
                      <mat-icon class="camera-icon">camera_alt</mat-icon>
                      {{ detection.cameraId }}
                    </div>
                    <div class="camera-type">
                      <span class="badge">{{ detection.cameraType || 'browser' }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Notifications Column -->
              <ng-container matColumnDef="notifications">
                <th mat-header-cell *matHeaderCellDef>Notifications</th>
                <td mat-cell *matCellDef="let detection">
                  <div class="notification-status">
                    <div class="notification-item" *ngIf="detection.emailSent">
                      <mat-icon class="notification-icon success">email</mat-icon>
                      <span>Email sent</span>
                    </div>
                    <div class="notification-item" *ngIf="detection.smsSent">
                      <mat-icon class="notification-icon success">sms</mat-icon>
                      <span>SMS sent</span>
                    </div>
                    <div class="notification-item" *ngIf="!detection.notificationSent">
                      <mat-icon class="notification-icon muted">notifications_off</mat-icon>
                      <span>No notifications</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let detection">
                  <button mat-icon-button color="primary" (click)="viewDetails(detection)" matTooltip="View Detection Details">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" 
                          (click)="openLocationMap(detection)" 
                          *ngIf="detection.latitude && detection.longitude"
                          matTooltip="View on Map">
                    <mat-icon>map</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <!-- No Results Message -->
          <div *ngIf="detections.length === 0" class="no-results">
            <mat-icon>info</mat-icon>
            <h4>No detection history</h4>
            <p>No face detection events have been recorded yet.</p>
            <button mat-raised-button color="primary" routerLink="/detect">
              <mat-icon>camera_alt</mat-icon>
              Start Face Detection
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Detection Details Modal -->
      <mat-card *ngIf="selectedDetection" class="detection-details-card mt-3">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>info</mat-icon>
            Detection Details
          </mat-card-title>
          <mat-card-subtitle>
            Complete information for detection #{{ selectedDetection.id }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="row">
            <div class="col-md-6">
              <div class="detail-group">
                <label>Detection ID:</label>
                <p>#{{ selectedDetection.id }}</p>
              </div>

              <div class="detail-group">
                <label>Detection Time:</label>
                <p>{{ selectedDetection.detectionTime | date:'full' }}</p>
              </div>

              <div class="detail-group">
                <label>Confidence Score:</label>
                <p>{{ (selectedDetection.confidenceScore * 100) | number:'1.1-1' }}%</p>
              </div>

              <div class="detail-group" *ngIf="selectedDetection.person">
                <label>Matched Person:</label>
                <p>{{ selectedDetection.person.firstName }} {{ selectedDetection.person.lastName }}</p>
                <p class="text-muted">{{ selectedDetection.person.email }}</p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="detail-group" *ngIf="selectedDetection.cameraId">
                <label>Camera ID:</label>
                <p>{{ selectedDetection.cameraId }}</p>
              </div>

              <div class="detail-group">
                <label>Camera Type:</label>
                <p>{{ selectedDetection.cameraType || 'browser' }}</p>
              </div>

              <div class="detail-group" *ngIf="selectedDetection.latitude && selectedDetection.longitude">
                <label>Location:</label>
                <p>{{ selectedDetection.latitude | number:'1.6-6' }}, {{ selectedDetection.longitude | number:'1.6-6' }}</p>
                <p class="text-muted" *ngIf="selectedDetection.locationAddress">{{ selectedDetection.locationAddress }}</p>
              </div>

              <div class="detail-group">
                <label>Notifications:</label>
                <div class="notification-summary">
                  <span class="notification-badge" [class.sent]="selectedDetection.emailSent">
                    <mat-icon>email</mat-icon>
                    Email {{ selectedDetection.emailSent ? 'Sent' : 'Not Sent' }}
                  </span>
                  <span class="notification-badge" [class.sent]="selectedDetection.smsSent">
                    <mat-icon>sms</mat-icon>
                    SMS {{ selectedDetection.smsSent ? 'Sent' : 'Not Sent' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="selectedDetection = null">
            <mat-icon>close</mat-icon>
            Close
          </button>
          <button mat-raised-button color="primary" 
                  (click)="openLocationMap(selectedDetection)" 
                  *ngIf="selectedDetection.latitude && selectedDetection.longitude">
            <mat-icon>map</mat-icon>
            View on Map
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .detections-card {
      margin: 2rem 0;
    }

    .stats-row {
      display: flex;
      justify-content: space-around;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-item h4 {
      font-size: 2rem;
      margin: 0;
      color: #3f51b5;
      font-weight: 500;
    }

    .stat-item p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .detections-table {
      width: 100%;
      background: white;
    }

    .detections-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .person-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .match-icon.success {
      color: #4caf50;
    }

    .match-icon.warning {
      color: #ff9800;
    }

    .person-details small {
      display: block;
      color: #666;
    }

    .unknown-person {
      color: #999;
      font-style: italic;
    }

    .confidence-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .confidence-bar {
      width: 60px;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(45deg, #4caf50, #81c784);
      transition: width 0.3s ease;
    }

    .confidence-text {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .location-info {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .location-icon {
      color: #3f51b5;
      margin-top: 2px;
    }

    .coordinates {
      font-family: monospace;
      font-size: 0.8rem;
    }

    .address {
      font-size: 0.8rem;
      color: #666;
    }

    .camera-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .camera-id {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .camera-icon {
      font-size: 1rem;
      color: #666;
    }

    .badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .notification-status {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .notification-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
    }

    .notification-icon {
      font-size: 1rem;
    }

    .notification-icon.success {
      color: #4caf50;
    }

    .notification-icon.muted {
      color: #999;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      margin-bottom: 1rem;
      color: #ccc;
    }

    .detection-details-card {
      background: #fafafa;
    }

    .detail-group {
      margin-bottom: 1rem;
    }

    .detail-group label {
      font-weight: 600;
      color: #555;
      display: block;
      margin-bottom: 0.25rem;
    }

    .detail-group p {
      margin: 0;
      color: #333;
    }

    .notification-summary {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .notification-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.8rem;
      background: #f5f5f5;
      color: #666;
    }

    .notification-badge.sent {
      background: #d4edda;
      color: #155724;
    }

    .text-muted {
      color: #999;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .stats-row {
        flex-direction: column;
        gap: 1rem;
      }

      .table-container {
        font-size: 0.8rem;
      }

      .notification-status {
        align-items: flex-start;
      }
    }
  `]
})
export class DetectionHistoryComponent implements OnInit {
  detections: DetectionLog[] = [];
  selectedDetection: DetectionLog | null = null;
  displayedColumns = ['detectionTime', 'person', 'confidence', 'location', 'camera', 'notifications', 'actions'];

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadDetections();
  }

  loadDetections() {
    this.apiService.getRecentDetections(50).subscribe({
      next: (detections) => {
        this.detections = detections;
      },
      error: (error) => {
        console.error('Error loading detections:', error);
        this.snackBar.open('Error loading detection history', 'Close', { duration: 3000 });
      }
    });
  }

  getMatchedCount(): number {
    return this.detections.filter(d => d.person).length;
  }

  getNotificationCount(): number {
    return this.detections.filter(d => d.notificationSent).length;
  }

  viewDetails(detection: DetectionLog) {
    this.selectedDetection = detection;
  }

  openLocationMap(detection: DetectionLog) {
    if (detection.latitude && detection.longitude) {
      const url = `https://maps.google.com/?q=${detection.latitude},${detection.longitude}`;
      window.open(url, '_blank');
    }
  }
}