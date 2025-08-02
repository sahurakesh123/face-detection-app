import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person } from '../models/person.model';
import { DetectionLog, FaceDetectionResponse } from '../models/detection.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Person endpoints
  registerPerson(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/persons/register`, formData);
  }

  getAllPersons(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}/persons`);
  }

  getPersonById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}/persons/${id}`);
  }

  searchPersons(name: string): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}/persons/search`, {
      params: { name }
    });
  }

  updatePerson(id: number, person: Person): Observable<any> {
    return this.http.put(`${this.baseUrl}/persons/${id}`, person);
  }

  deactivatePerson(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/persons/${id}`);
  }

  // Face detection endpoints
  detectFace(formData: FormData): Observable<FaceDetectionResponse> {
    return this.http.post<FaceDetectionResponse>(`${this.baseUrl}/face/detect`, formData);
  }

  getRecentDetections(limit: number = 10): Observable<DetectionLog[]> {
    return this.http.get<DetectionLog[]>(`${this.baseUrl}/face/detections/recent`, {
      params: { limit: limit.toString() }
    });
  }

  getDetectionsByCamera(cameraId: string): Observable<DetectionLog[]> {
    return this.http.get<DetectionLog[]>(`${this.baseUrl}/face/detections/camera/${cameraId}`);
  }

  getDetectionsByPerson(personId: number): Observable<DetectionLog[]> {
    return this.http.get<DetectionLog[]>(`${this.baseUrl}/face/detections/person/${personId}`);
  }
}