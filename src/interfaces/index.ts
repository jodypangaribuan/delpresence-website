// API Interfaces
export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export interface ApiError extends Error {
  status?: number;
  details?: any;
  rawResponse?: any;
}

// Auth interfaces
import { UserRole } from "@/utils/auth";

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface UserProfile extends User {
  department?: string;
  title?: string;
  phone?: string;
  address?: string;
} 