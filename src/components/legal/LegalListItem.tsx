import { ReactNode } from 'react';
import { siteConfig } from '@/shared/utils/siteConfig';

interface LegalListItemProps {
  children: ReactNode;
}

export default function LegalListItem({ children }: LegalListItemProps) {
  const { colors } = siteConfig;
  
  return (
    <li className="flex items-start">
      <span 
        className="inline-block w-2 h-2 rounded-full mt-2 mr-2"
        style={{ backgroundColor: `${colors.primary}70` }} // Using 70 for opacity
      />
      <span>{children}</span>
    </li>
  );
} 