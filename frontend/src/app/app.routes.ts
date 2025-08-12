import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'detect', 
    loadComponent: () => import('./components/face-detection/face-detection.component').then(m => m.FaceDetectionComponent)
  },
  { 
    path: 'persons', 
    loadComponent: () => import('./components/persons-list/persons-list.component').then(m => m.PersonsListComponent)
  },
  { 
    path: 'detections', 
    loadComponent: () => import('./components/detection-history/detection-history.component').then(m => m.DetectionHistoryComponent)
  },
  { 
    path: 'debug', 
    loadComponent: () => import('./components/debug/image-test.component').then(m => m.ImageTestComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];