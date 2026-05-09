import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import DynamicBranding from "@/components/DynamicBranding";
import UpdateChecker from "@/components/UpdateChecker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sahabat Network | ISP Management",
  description: "Advanced Management System for ISP & Mikrotik",
  icons: {
    icon: '/favicon.png',
  }
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
