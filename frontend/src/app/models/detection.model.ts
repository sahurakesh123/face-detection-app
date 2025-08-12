import { Person } from './person.model';

export interface DetectionLog {
  id: number;
  person: Person | null;
  detectionImagePath: string;
  confidenceScore: number;
  detectionTime: Date;
  locationAddress: string;
  latitude: number;
  longitude: number;
  cameraId: string;
  cameraType: string;
  notificationSent: boolean;
  emailSent: boolean;
  smsSent: boolean;
}

export interface FaceDetectionRequest {
  image: File;
  latitude?: number;
  longitude?: number;
  cameraId?: string;
  cameraType?: string;
  locationAddress?: string;
}

export interface FaceDetectionResponse {
  success: boolean;
  matched: boolean;
  detectionId: number;
  person: Person | null;
  confidence: number;
  detectionTime: Date;
  message?: string;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DetectionRequest {
  base64Image: string;
  latitude: number;
  longitude: number;
  cameraId: string;
  cameraType: string;
}