import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person } from '../models/person.model';
import { DetectionLog, FaceDetectionResponse, DetectionRequest } from '../models/detection.model';
import { PersonRegistrationRequest } from '../models/person-registration.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Person Management
  registerPerson(request: PersonRegistrationRequest): Observable<Person> {
    return this.http.post<Person>(`${this.baseUrl}/persons/register`, request);
  }

  getAllPersons(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}/persons`);
  }

  deactivatePerson(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/persons/${id}`);
  }

  // Face Detection
  detectFace(request: DetectionRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/detections/detect`, request);
  }

  // Detection History
  getRecentDetections(limit?: number): Observable<DetectionLog[]> {
    const options = limit ? { params: { limit: limit.toString() } } : {};
    return this.http.get<DetectionLog[]>(`${this.baseUrl}/detections/recent`, options);
  }
}