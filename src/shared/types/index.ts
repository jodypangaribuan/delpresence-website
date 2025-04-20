/**
 * Site configuration types
 */
export interface SiteConfig {
  name: string;
  fullName: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
  colors: {
    primary: string;
    secondary: string;
  };
}

/**
 * Card image type for the Stack component
 */
export interface CardImage {
  id: string;
  img: string;
}

// Academic types
export interface Faculty {
  id: number;
  uuid: string;
  code: string;
  name: string;
  dean?: string;
  establishment_year?: number;
  lecturer_count?: number;
}

export interface StudyProgram {
  id: number;
  uuid: string;
  code: string;
  name: string;
  faculty_id: number;
  head_of_program?: string;
  accreditation?: string;
  decree_number?: string;
  establishment_year?: number;
  lecturer_count?: number;
  student_count?: number;
}

/**
 * Building interface with validation requirements
 * - code: 2-10 characters, alphanumeric with dashes
 * - name: 3-100 characters, cannot be empty
 * - floors: minimum 1, must be a positive integer
 * - description: optional, maximum 500 characters
 */
export interface Building {
  id: number;
  uuid?: string;
  code: string;
  name: string;
  floors: number;
  description?: string;
}

/**
 * BuildingWithStats interface for displaying building with room statistics
 */
export interface BuildingWithStats {
  building: Building;
  room_count: number;
}

/**
 * Room interface with validation requirements
 * - code: 2-10 characters, alphanumeric with dashes
 * - name: 3-100 characters, cannot be empty
 * - building_id: must be valid building id
 * - floor: minimum 0 (ground floor), must be non-negative integer
 * - capacity: minimum 0, must be a non-negative integer
 * - description: optional, maximum 500 characters
 */
export interface Room {
  id: number;
  uuid?: string;
  code: string;
  name: string;
  building_id: number;
  building: {
    id: number;
    name: string;
  };
  floor: number;
  capacity: number;
  has_ac: boolean;
  has_projector: boolean;
  has_internet: boolean;
  description?: string;
} 