import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface FaceDetection {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  cameraId?: string;
  cameraLocation?: string;
  latitude?: number;
  longitude?: number;
  confidenceScore: number;
  faceImageUrl?: string;
  status: 'DETECTED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'UNKNOWN';
  notificationSent: boolean;
  notificationSentAt?: string;
  detectedAt: string;
  additionalNotes?: string;
}

export interface DetectionStats {
  totalUsers: number;
  usersWithFaces: number;
  totalDetections: number;
  detectionsToday: number;
}

export interface DetectionResponse {
  success: boolean;
  matched: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  detection?: {
    id: number;
    confidenceScore: number;
    detectedAt: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FaceDetectionService {
  private readonly API_URL = 'http://localhost:8080/api';
  private detectionSubject = new BehaviorSubject<FaceDetection | null>(null);
  public detection$ = this.detectionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  detectFace(imageFile: File, location?: { latitude: number; longitude: number }, cameraInfo?: { id: string; location: string }): Observable<DetectionResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    if (location) {
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
    }
    
    if (cameraInfo) {
      formData.append('cameraId', cameraInfo.id);
      formData.append('cameraLocation', cameraInfo.location);
    }

    return this.http.post<DetectionResponse>(`${this.API_URL}/face-detection/detect`, formData);
  }

  registerFace(userId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('image', imageFile);

    return this.http.post(`${this.API_URL}/face-detection/register-face`, formData, {
      headers: this.getHeaders()
    });
  }

  getDetectionStats(): Observable<DetectionStats> {
    return this.http.get<DetectionStats>(`${this.API_URL}/face-detection/stats`, {
      headers: this.getHeaders()
    });
  }

  getRecentDetections(limit: number = 10): Observable<FaceDetection[]> {
    return this.http.get<FaceDetection[]>(`${this.API_URL}/face-detection/recent-detections?limit=${limit}`, {
      headers: this.getHeaders()
    });
  }

  getUserDetections(userId: number, page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.API_URL}/users/${userId}/detections?page=${page}&size=${size}`, {
      headers: this.getHeaders()
    });
  }

  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  async captureFromCamera(): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          video.srcObject = stream;
          video.play();

          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Wait a bit for the camera to stabilize
            setTimeout(() => {
              context.drawImage(video, 0, 0);
              
              // Stop the video stream
              stream.getTracks().forEach(track => track.stop());

              // Convert canvas to blob
              canvas.toBlob(blob => {
                if (blob) {
                  const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
                  resolve(file);
                } else {
                  reject(new Error('Could not capture image'));
                }
              }, 'image/jpeg', 0.8);
            }, 1000);
          };
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async captureFromFile(input: HTMLInputElement): Promise<File> {
    return new Promise((resolve, reject) => {
      if (input.files && input.files[0]) {
        resolve(input.files[0]);
      } else {
        reject(new Error('No file selected'));
      }
    });
  }

  setDetection(detection: FaceDetection | null): void {
    this.detectionSubject.next(detection);
  }

  getCurrentDetection(): FaceDetection | null {
    return this.detectionSubject.value;
  }
}