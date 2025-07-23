export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}



export interface AuthResponse {
  token: string;        // ← Tu API devuelve "Token"
  email: string;        // ← Tu API devuelve "Email"
  name: string;         // ← Tu API devuelve "Name"
  expiresAt: string;    // ← Tu API devuelve "ExpiresAt"
  refreshToken?: string; // ← Opcional
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

import { User } from '../../../shared/models/user.interface';
export interface ValidationResponse {
  valid: boolean;
  user?: User;
}