import { SiteConfig, CardImage } from "@/shared/types";

/**
 * Site-wide configuration variables
 */
export const siteConfig: SiteConfig = {
  name: 'DelPresence',
  fullName: 'DelPresence - Sistem Kehadiran Digital IT Del',
  description: 'Platform terintegrasi untuk manajemen presensi perkuliahan yang efisien, cepat dan akurat bagi seluruh civitas akademika.',
  url: 'https://delpresence.example.com',
  ogImage: '/images/og-image.jpg',
  links: {
    institution: 'https://www.del.ac.id',
    privacyPolicy: '/privacy-policy',
    termsOfUse: '/terms-of-use',
    download: '#',
  },
  colors: {
    primary: '#0687C9',
    primaryHover: '#0078B5',
    gradient: {
      from: '#0687C9',
      to: '#00A3FF',
    }
  },
  copyright: `© ${new Date().getFullYear()} Institut Teknologi Del | Developed by Group 4, Final Project 2. All rights reserved.`
};

/**
 * Card image data for homepage
 */
export const homepageImages: CardImage[] = [
  {
    id: 5,
    img: "/images/image-beranda-5.jpg",
  },
  {
    id: 4,
    img: "/images/image-beranda-4.jpg",
  },
  {
    id: 3,
    img: "/images/image-beranda-3.jpg",
  },
  {
    id: 2,
    img: "/images/image-beranda-2.jpg",
  },
  {
    id: 1,
    img: "/images/image-beranda-1.jpg",
  },
];

export const teamData = [
  {
    id: 1,
    name: "Jody Edriano Pangaribuan",
    designation: "Project Manager",
    image: "/images/team/member1.jpg",
  },
  {
    id: 2,
    name: "Marshanda Kasih Simangunsong",
    designation: "?",
    image: "/images/team/member2.jpg",
  },
  {
    id: 3,
    name: "Anno Deritman Siregar",
    designation: "?",
    image: "/images/team/member3.jpg",
  },
  {
    id: 4,
    name: "Jessica Anastasya Purba",
    designation: "?",
    image: "/images/team/member4.jpg",
  },
  {
    id: 5,
    name: "Prapanca Ronaldo Panjaitan",
    designation: "?",
    image: "/images/team/member5.jpg",
  },
  {
    id: 6,
    name: "Kezia M S Siahaan",
    designation: "?",
    image: "/images/team/member6.jpg",
  },
]; 