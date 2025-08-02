import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span class="toolbar-title">Face Recognition System</span>
      <span class="toolbar-spacer"></span>
      
      <ng-container *ngIf="authService.isAuthenticated(); else loginButton">
        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="notification-badge">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </button>
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item routerLink="/face-registration">
            <mat-icon>face</mat-icon>
            <span>Register Face</span>
          </button>
          <button mat-menu-item routerLink="/detections">
            <mat-icon>history</mat-icon>
            <span>Detection History</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </ng-container>
      
      <ng-template #loginButton>
        <button mat-button routerLink="/login">Login</button>
        <button mat-raised-button routerLink="/register">Register</button>
      </ng-template>
    </mat-toolbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .toolbar-title {
      font-size: 1.5rem;
      font-weight: 500;
    }
    
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }
    
    .notification-badge {
      position: relative;
    }
    
    .notification-badge::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background-color: #ff4081;
      border-radius: 50%;
      border: 2px solid #3f51b5;
    }
  `]
})
export class AppComponent {
  title = 'Face Recognition System';

  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}