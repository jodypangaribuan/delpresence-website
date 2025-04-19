import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteConfig } from "@/shared/utils/siteConfig";
import ClickSparkProvider from "@/components/ui/ClickSpark/ClickSparkProvider";
import { Toaster } from "sonner";
import { LoadingProvider } from "@/context/loadingContext";

const dmSans = localFont({
  src: [
    {
      path: '../../public/fonts/dm-sans/dm-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/dm-sans/dm-sans-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/dm-sans/dm-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: siteConfig.fullName,
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <LoadingProvider>
          <ClickSparkProvider>
            {children}
            <Toaster position="bottom-right" />
          </ClickSparkProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
