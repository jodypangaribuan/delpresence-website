/**
 * Common types for legal pages (Privacy Policy and Terms of Use)
 */

import { ReactNode } from 'react';

/**
 * Interface for the legal section data
 */
export interface LegalSection {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
} 