import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" class="app-toolbar">
        <button mat-icon-button (click)="sidenav.toggle()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="toolbar-title">Face Recognition System</span>
        <span class="spacer"></span>
        <button mat-button routerLink="/dashboard">
          <mat-icon>dashboard</mat-icon>
          Dashboard
        </button>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav mode="over" class="sidenav">
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" (click)="sidenav.close()">
              <mat-icon matListIcon>dashboard</mat-icon>
              <span matLine>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/register" (click)="sidenav.close()">
              <mat-icon matListIcon>person_add</mat-icon>
              <span matLine>Register Person</span>
            </a>
            <a mat-list-item routerLink="/detect" (click)="sidenav.close()">
              <mat-icon matListIcon>camera_alt</mat-icon>
              <span matLine>Face Detection</span>
            </a>
            <a mat-list-item routerLink="/persons" (click)="sidenav.close()">
              <mat-icon matListIcon>people</mat-icon>
              <span matLine>Registered Persons</span>
            </a>
            <a mat-list-item routerLink="/detections" (click)="sidenav.close()">
              <mat-icon matListIcon>history</mat-icon>
              <span matLine>Detection History</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .toolbar-title {
      font-size: 1.2rem;
      font-weight: 500;
      margin-left: 16px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .sidenav-container {
      flex: 1;
      margin-top: 64px;
    }

    .sidenav {
      width: 250px;
      background-color: #fafafa;
    }

    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    mat-nav-list a {
      margin-bottom: 8px;
      border-radius: 8px;
      margin: 4px 8px;
    }

    mat-nav-list a:hover {
      background-color: rgba(63, 81, 181, 0.1);
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 10px;
      }
    }
  `]
})
export class AppComponent {
  title = 'Face Recognition System';
}