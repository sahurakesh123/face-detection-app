import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { FaceRecognitionService, FaceData } from '../../services/face-recognition.service';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule
  ],
  template: `
    <div class="container">
      <h1>Face Matches</h1>
      
      <div class="stats-overview">
        <mat-card class="stat-card">
          <mat-card-content>
            <h3>Total Matches</h3>
            <p class="stat-number">{{ totalMatches }}</p>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <h3>Today's Matches</h3>
            <p class="stat-number">{{ todayMatches }}</p>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="stat-card">
          <mat-card-content>
            <h3>Average Confidence</h3>
            <p class="stat-number">{{ averageConfidence }}%</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="matches-card">
        <mat-card-header>
          <mat-card-title>Recent Face Matches</mat-card-title>
          <mat-card-subtitle>View and manage face recognition matches</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="loading-spinner" *ngIf="isLoading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Loading matches...</p>
          </div>

          <div class="table-container" *ngIf="!isLoading">
            <table mat-table [dataSource]="displayedMatches" matSort (matSortChange)="sortData($event)">
              <!-- Match Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
                <td mat-cell *matCellDef="let match">
                  <mat-chip [color]="match.isMatched ? 'accent' : 'primary'" selected>
                    <mat-icon>{{ match.isMatched ? 'check_circle' : 'face' }}</mat-icon>
                    {{ match.isMatched ? 'Match' : 'No Match' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Confidence Column -->
              <ng-container matColumnDef="confidence">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Confidence </th>
                <td mat-cell *matCellDef="let match">
                  <div class="confidence-bar">
                    <div class="confidence-fill" [style.width.%]="match.confidence * 100"></div>
                    <span>{{ (match.confidence * 100).toFixed(1) }}%</span>
                  </div>
                </td>
              </ng-container>

              <!-- Camera Source Column -->
              <ng-container matColumnDef="cameraSource">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Camera Source </th>
                <td mat-cell *matCellDef="let match">
                  <div class="camera-info">
                    <mat-icon>{{ getCameraIcon(match.cameraSource) }}</mat-icon>
                    <span>{{ match.cameraSource | titlecase }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Location Column -->
              <ng-container matColumnDef="location">
                <th mat-header-cell *matHeaderCellDef> Location </th>
                <td mat-cell *matCellDef="let match">
                  <div class="location-info">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ match.location || 'Unknown' }}</span>
                    <button 
                      mat-icon-button 
                      color="primary" 
                      (click)="viewOnMap(match)"
                      *ngIf="match.latitude && match.longitude">
                      <mat-icon>map</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="capturedAt">
                <th mat-header-cell *matHeaderCellDef mat-sort-header> Date & Time </th>
                <td mat-cell *matCellDef="let match">
                  {{ match.capturedAt | date:'medium' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let match">
                  <button mat-icon-button color="primary" (click)="viewDetails(match)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="downloadImage(match)">
                    <mat-icon>download</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator 
              [length]="totalMatches"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Map Modal -->
      <div class="map-modal" *ngIf="showMapModal" (click)="closeMapModal()">
        <div class="map-content" (click)="$event.stopPropagation()">
          <div class="map-header">
            <h3>Location Map</h3>
            <button mat-icon-button (click)="closeMapModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div id="map" class="map-container"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #2196f3;
      margin: 10px 0;
    }

    .matches-card {
      margin-bottom: 30px;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .confidence-bar {
      position: relative;
      width: 100px;
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      transition: width 0.3s ease;
    }

    .confidence-bar span {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: #333;
    }

    .camera-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .location-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .map-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .map-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      overflow: hidden;
    }

    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .map-header h3 {
      margin: 0;
    }

    .map-container {
      height: 400px;
      width: 100%;
    }

    @media (max-width: 768px) {
      .stats-overview {
        grid-template-columns: 1fr;
      }

      .table-container {
        font-size: 12px;
      }

      .confidence-bar {
        width: 60px;
      }

      .map-content {
        width: 95%;
        margin: 10px;
      }
    }
  `]
})
export class MatchesComponent implements OnInit {
  displayedColumns: string[] = ['status', 'confidence', 'cameraSource', 'location', 'capturedAt', 'actions'];
  displayedMatches: FaceData[] = [];
  allMatches: FaceData[] = [];
  isLoading = false;
  totalMatches = 0;
  todayMatches = 0;
  averageConfidence = 0;
  pageSize = 10;
  currentPage = 0;
  showMapModal = false;
  selectedMatch: FaceData | null = null;

  constructor(private faceRecognitionService: FaceRecognitionService) {}

  ngOnInit() {
    this.loadMatches();
  }

  private loadMatches() {
    this.isLoading = true;
    
    this.faceRecognitionService.getRecentMatches().subscribe({
      next: (response) => {
        if (response.success) {
          this.allMatches = response.data;
          this.totalMatches = this.allMatches.length;
          this.calculateStats();
          this.updateDisplayedMatches();
        }
      },
      error: (error) => {
        console.error('Error loading matches:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private calculateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.todayMatches = this.allMatches.filter(match => {
      const matchDate = new Date(match.capturedAt);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate.getTime() === today.getTime();
    }).length;

    if (this.allMatches.length > 0) {
      const totalConfidence = this.allMatches.reduce((sum, match) => sum + match.confidence, 0);
      this.averageConfidence = Math.round((totalConfidence / this.allMatches.length) * 100);
    }
  }

  private updateDisplayedMatches() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedMatches = this.allMatches.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedMatches();
  }

  sortData(sort: Sort) {
    const data = this.allMatches.slice();
    
    if (!sort.active || sort.direction === '') {
      this.allMatches = data;
      this.updateDisplayedMatches();
      return;
    }

    this.allMatches = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'confidence': return this.compare(a.confidence, b.confidence, isAsc);
        case 'capturedAt': return this.compare(new Date(a.capturedAt), new Date(b.capturedAt), isAsc);
        case 'cameraSource': return this.compare(a.cameraSource, b.cameraSource, isAsc);
        case 'status': return this.compare(a.isMatched, b.isMatched, isAsc);
        default: return 0;
      }
    });
    
    this.updateDisplayedMatches();
  }

  private compare(a: any, b: any, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getCameraIcon(source: string): string {
    switch (source.toLowerCase()) {
      case 'browser': return 'computer';
      case 'laptop': return 'laptop';
      case 'atm': return 'atm';
      case 'cctv': return 'videocam';
      default: return 'camera_alt';
    }
  }

  viewDetails(match: FaceData) {
    // Implement detailed view modal
    console.log('View details for match:', match);
  }

  downloadImage(match: FaceData) {
    if (match.faceImage) {
      const link = document.createElement('a');
      link.href = match.faceImage;
      link.download = `face-capture-${match.id}.jpg`;
      link.click();
    }
  }

  viewOnMap(match: FaceData) {
    if (match.latitude && match.longitude) {
      this.selectedMatch = match;
      this.showMapModal = true;
      setTimeout(() => this.initializeMap(), 100);
    }
  }

  closeMapModal() {
    this.showMapModal = false;
    this.selectedMatch = null;
  }

  private initializeMap() {
    if (!this.selectedMatch) return;

    // Initialize Leaflet map
    const map = (window as any).L.map('map').setView(
      [this.selectedMatch.latitude!, this.selectedMatch.longitude!], 
      15
    );

    (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    (window as any).L.marker([this.selectedMatch.latitude!, this.selectedMatch.longitude!])
      .addTo(map)
      .bindPopup(`Face captured at: ${this.selectedMatch.location || 'Unknown location'}`)
      .openPopup();
  }
}