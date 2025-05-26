import { UserRole } from "@/utils/auth";

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