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
    };
  };
  copyright: string;
}

/**
 * Card image type for the Stack component
 */
export interface CardImage {
  id: number;
  img: string;
} 