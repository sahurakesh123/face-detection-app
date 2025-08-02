import { Person } from './person.model';

export interface DetectionLog {
  id: number;
  person?: Person;
  detectionImagePath: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  cameraId?: string;
  cameraType?: string;
  confidenceScore: number;
  detectionTime: Date;
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
  person?: Person;
  confidence: number;
  detectionTime: Date;
  message: string;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}