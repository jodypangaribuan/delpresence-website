import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/shared/utils/siteConfig";
import ClickSparkProvider from "@/components/ui/ClickSpark/ClickSparkProvider";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="id">
      <body className={inter.className}>
        <ClickSparkProvider>
          {children}
        </ClickSparkProvider>
      </body>
    </html>
  );
}
