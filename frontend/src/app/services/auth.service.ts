import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'USER' | 'ADMIN' | 'OPERATOR';
  enabled: boolean;
  faceEncoding?: string;
  faceImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuth(response.token, response.user);
        })
      );
  }

  register(user: Partial<User> & { password: string }): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, user);
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(response => {
        this.setAuth(response.token, response.user);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No user logged in');
    }

    return this.http.put<User>(`${this.API_URL}/users/${user.id}`, userData)
      .pipe(
        tap(updatedUser => {
          this.currentUserSubject.next(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        })
      );
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isOperator(): boolean {
    return this.hasRole('OPERATOR');
  }
}