export interface Person {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  registrationDate?: Date;
  isActive?: boolean;
}

export interface PersonRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  faceImage: File;
}