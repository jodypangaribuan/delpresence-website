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
    institution: string;
    privacyPolicy: string;
    termsOfUse: string;
    download: string;
  };
  colors: {
    primary: string;
    primaryHover: string;
    gradient: {
      from: string;
      to: string;
    }
  };
  copyright: string;
}

/**
 * Card image type for the Stack component
 */
export interface CardImage {
  id: number | string;
  img: string;
}

// Academic types
export interface Faculty {
  id: number;
  code: string;
  name: string;
  dean?: string;
  establishment_year?: number;
  lecturer_count?: number;
}

export interface StudyProgram {
  id: number;
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
 */
export interface Building {
  id: number;
  code: string;
  name: string;
  floors: number;
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
 */
export interface Room {
  id: number;
  code: string;
  name: string;
  building_id: number;
  building: {
    id: number;
    name: string;
  };
  floor: number;
  capacity: number;
} 