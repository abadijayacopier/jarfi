import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import DynamicBranding from "@/components/DynamicBranding";
import UpdateChecker from "@/components/UpdateChecker";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JARFI | ISP Management",
  description: "Advanced Management System for ISP & Mikrotik",
  manifest: "/manifest.json",
  icons: {
    icon: '/jarfi_logo_1778350215847.png',
    apple: '/jarfi_logo_1778350215847.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JARFI",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <ThemeProvider>
          <DynamicBranding />
          <UpdateChecker />
          <PWARegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
