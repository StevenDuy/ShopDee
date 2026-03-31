import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { GlobalProviders } from "@/components/providers/global-providers";
import { PermissionModal } from "@/components/PermissionModal";

export const metadata: Metadata = {
  title: "ShopDee - E-Commerce",
  description: "Comprehensive e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <GlobalProviders>
          <PermissionModal />
          {children}
        </GlobalProviders>
      </body>
    </html>
  );
}
