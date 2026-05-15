import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PropManager – Property & Tenant Tracker",
  description: "Track your rental properties, tenants, payments, and expenses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Sidebar />
        <main className="lg:ml-60 min-h-screen p-6 pt-16 lg:pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
