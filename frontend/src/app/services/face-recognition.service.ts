import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface FaceCaptureRequest {
  faceImage: string;
  faceEncoding?: string;
  confidence?: number;
  cameraSource: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}

export interface FaceData {
  id: number;
  userId: number;
  faceImage: string;
  faceEncoding: string;
  confidence: number;
  cameraSource: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  capturedAt: string;
  isMatched: boolean;
  matchedUserId?: number;
  matchedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  captureAndMatchFace(captureData: FaceCaptureRequest): Observable<ApiResponse<FaceData>> {
    return this.http.post<ApiResponse<FaceData>>(
      `${this.API_URL}/faces/capture`,
      captureData,
      { headers: this.getHeaders() }
    );
  }

  getRecentMatches(): Observable<ApiResponse<FaceData[]>> {
    return this.http.get<ApiResponse<FaceData[]>>(
      `${this.API_URL}/faces/matches`,
      { headers: this.getHeaders() }
    );
  }

  getUserFaceData(userId: number): Observable<ApiResponse<FaceData[]>> {
    return this.http.get<ApiResponse<FaceData[]>>(
      `${this.API_URL}/faces/user/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  getMyFaceData(): Observable<ApiResponse<FaceData[]>> {
    return this.http.get<ApiResponse<FaceData[]>>(
      `${this.API_URL}/faces/my-faces`,
      { headers: this.getHeaders() }
    );
  }

  // Face detection using face-api.js
  async detectFaces(video: HTMLVideoElement): Promise<any[]> {
    try {
      const detections = await (window as any).faceapi.detectAllFaces(video, {
        inputSize: 224,
        scoreThreshold: 0.5
      });
      return detections;
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  }

  // Generate face encoding using face-api.js
  async generateFaceEncoding(video: HTMLVideoElement): Promise<string | null> {
    try {
      const descriptor = await (window as any).faceapi.computeFaceDescriptor(video);
      return Array.from(descriptor).join(',');
    } catch (error) {
      console.error('Error generating face encoding:', error);
      return null;
    }
  }

  // Capture image from video element
  captureImageFromVideo(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    
    return '';
  }

  // Get current location
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; location: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Get location name using reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const location = data.display_name || `${latitude}, ${longitude}`;
            
            resolve({ latitude, longitude, location });
          } catch (error) {
            resolve({ latitude, longitude, location: `${latitude}, ${longitude}` });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }
}