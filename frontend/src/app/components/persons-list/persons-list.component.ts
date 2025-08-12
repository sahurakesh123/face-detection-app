import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Person } from '../../models/person.model';

@Component({
  selector: 'app-persons-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card class="persons-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>people</mat-icon>
            Registered Persons
          </mat-card-title>
          <mat-card-subtitle>
            Manage and view all registered persons in the system
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Search and Actions -->
          <div class="actions-bar mb-3">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search persons</mat-label>
              <input matInput [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Enter name...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <button mat-raised-button color="primary" routerLink="/register" class="add-btn">
              <mat-icon>person_add</mat-icon>
              Add New Person
            </button>
          </div>

          <!-- Persons Table -->
          <div class="table-container">
            <table mat-table [dataSource]="filteredPersons" class="persons-table">
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let person">
                  <div class="person-name">
                    <strong>{{ person.firstName }} {{ person.lastName }}</strong>
                  </div>
                </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let person">
                  <div class="person-email">
                    <mat-icon class="email-icon">email</mat-icon>
                    {{ person.email }}
                  </div>
                </td>
              </ng-container>

              <!-- Phone Column -->
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let person">
                  <div class="person-phone" *ngIf="person.phoneNumber">
                    <mat-icon class="phone-icon">phone</mat-icon>
                    {{ person.phoneNumber }}
                  </div>
                  <span class="text-muted" *ngIf="!person.phoneNumber">Not provided</span>
                </td>
              </ng-container>

              <!-- Registration Date Column -->
              <ng-container matColumnDef="registrationDate">
                <th mat-header-cell *matHeaderCellDef>Registered</th>
                <td mat-cell *matCellDef="let person">
                  {{ person.registrationDate | date:'short' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let person">
                  <span class="status-badge" [class.active]="person.isActive" [class.inactive]="!person.isActive">
                    {{ person.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let person">
                  <button mat-icon-button color="primary" (click)="viewPerson(person)" matTooltip="View Details">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deactivatePerson(person)" 
                          *ngIf="person.isActive" matTooltip="Deactivate">
                    <mat-icon>block</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <!-- No Results Message -->
          <div *ngIf="filteredPersons.length === 0" class="no-results">
            <mat-icon>info</mat-icon>
            <h4>No persons found</h4>
            <p>{{ persons.length === 0 ? 'No persons registered yet.' : 'No persons match your search criteria.' }}</p>
            <button mat-raised-button color="primary" routerLink="/register" *ngIf="persons.length === 0">
              <mat-icon>person_add</mat-icon>
              Register First Person
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Person Details Modal (if selected) -->
      <mat-card *ngIf="selectedPerson" class="person-details-card mt-3">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person</mat-icon>
            Person Details
          </mat-card-title>
          <mat-card-subtitle>
            Complete information for {{ selectedPerson.firstName }} {{ selectedPerson.lastName }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="row">
            <div class="col-md-6">
              <div class="detail-group">
                <label>Full Name:</label>
                <p>{{ selectedPerson.firstName }} {{ selectedPerson.lastName }}</p>
              </div>

              <div class="detail-group">
                <label>Email Address:</label>
                <p>{{ selectedPerson.email }}</p>
              </div>

              <div class="detail-group" *ngIf="selectedPerson.phoneNumber">
                <label>Phone Number:</label>
                <p>{{ selectedPerson.phoneNumber }}</p>
              </div>

              <div class="detail-group" *ngIf="selectedPerson.address">
                <label>Address:</label>
                <p>{{ selectedPerson.address }}</p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="detail-group">
                <label>Registration Date:</label>
                <p>{{ selectedPerson.registrationDate | date:'full' }}</p>
              </div>

              <div class="detail-group">
                <label>Status:</label>
                <p>
                  <span class="status-badge" [class.active]="selectedPerson.isActive" [class.inactive]="!selectedPerson.isActive">
                    {{ selectedPerson.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </p>
              </div>

              <div class="detail-group">
                <label>Person ID:</label>
                <p>#{{ selectedPerson.id }}</p>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="selectedPerson = null">
            <mat-icon>close</mat-icon>
            Close
          </button>
          <button mat-raised-button color="warn" (click)="deactivatePerson(selectedPerson)" *ngIf="selectedPerson.isActive">
            <mat-icon>block</mat-icon>
            Deactivate Person
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .persons-card {
      margin: 2rem 0;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .search-field {
      flex: 1;
      max-width: 400px;
      margin-right: 1rem;
    }

    .add-btn {
      white-space: nowrap;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .persons-table {
      width: 100%;
      background: white;
    }

    .persons-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .person-name strong {
      color: #333;
    }

    .person-email, .person-phone {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .email-icon, .phone-icon {
      font-size: 1rem;
      color: #666;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge.active {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      margin-bottom: 1rem;
      color: #ccc;
    }

    .person-details-card {
      background: #fafafa;
    }

    .detail-group {
      margin-bottom: 1rem;
    }

    .detail-group label {
      font-weight: 600;
      color: #555;
      display: block;
      margin-bottom: 0.25rem;
    }

    .detail-group p {
      margin: 0;
      color: #333;
    }

    .text-muted {
      color: #999;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .actions-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .search-field {
        max-width: none;
        margin-right: 0;
      }

      .table-container {
        font-size: 0.9rem;
      }
    }
  `]
})
export class PersonsListComponent implements OnInit {
  persons: Person[] = [];
  filteredPersons: Person[] = [];
  selectedPerson: Person | null = null;
  searchTerm = '';
  displayedColumns = ['name', 'email', 'phone', 'registrationDate', 'status', 'actions'];

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadPersons();
  }

  loadPersons() {
    this.apiService.getAllPersons().subscribe({
      next: (persons) => {
        this.persons = persons;
        this.filteredPersons = persons;
      },
      error: (error: any) => {
        console.error('Error loading persons:', error);
        this.snackBar.open('Error loading persons', 'Close', { duration: 3000 });
      }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredPersons = this.persons;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPersons = this.persons.filter(person =>
      person.firstName.toLowerCase().includes(term) ||
      person.lastName.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term)
    );
  }

  viewPerson(person: Person) {
    this.selectedPerson = person;
  }

  deactivatePerson(person: Person) {
    if (confirm(`Are you sure you want to deactivate ${person.firstName} ${person.lastName}?`)) {
      this.apiService.deactivatePerson(person.id!).subscribe({
        next: () => {
          this.snackBar.open('Person deactivated successfully', 'Close', { duration: 3000 });
          this.loadPersons();
          this.selectedPerson = null;
        },
        error: (error: any) => {
          this.snackBar.open('Error deactivating person', 'Close', { duration: 3000 });
          console.error('Error deactivating person:', error);
        }
      });
    }
  }
}