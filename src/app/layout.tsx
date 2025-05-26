import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import "./globals.css";
import { siteConfig } from "@/shared/utils/siteConfig";
import ClickSparkProvider from "@/components/ui/ClickSpark/ClickSparkProvider";
import { Toaster } from "sonner";
import { LoadingProvider } from "@/context/loadingContext";
import { AuthProvider } from "@/context/authContext";

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
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon.png" },
      { url: "/images/icon-webpage.png" }
    ],
    shortcut: "/favicon/favicon.png",
    apple: "/favicon/apple-touch-icon.png",
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/favicon/apple-touch-icon.png",
      },
    ],
  }
};

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Standard favicon */}
        <link rel="icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon/favicon.png" />
        
        {/* iOS/macOS specific favicons */}
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        
        {/* Also keep the original paths for backwards compatibility */}
        <link rel="icon" href="/images/icon-webpage.png" />
        <link rel="shortcut icon" href="/images/icon-webpage.png" />
      </head>
      <body className={dmSans.className}>
        <AuthProvider>
          <LoadingProvider>
            <ClickSparkProvider>
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
              <Toaster 
                position="bottom-right"
                expand={true}
                richColors
                closeButton
                theme="light"
                style={{
                  fontSize: '14px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              />
            </ClickSparkProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
