// Enum untuk peran user
export enum UserRole {
  ADMIN = "Admin",
  LECTURER = "Dosen",
  ASSISTANT = "Asisten Dosen",
}

// Interface untuk data user
export interface User {
  id: string | number;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  photo?: string;
}

// Empty functions for compatibility
export function isAuthenticated(): boolean {
  return true;
}

export function getUserRole(): UserRole {
  return UserRole.ADMIN;
}

export function getUser(): User {
  return {
    id: 1,
    name: "Default User",
    username: "user",
    role: UserRole.ADMIN
  };
}

export function logout(): void {
  // No-op function
}

export function isAdmin(): boolean {
  return true;
}

export function isLecturer(): boolean {
  return true;
}

export function isAssistant(): boolean {
  return true;
} 