import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { FinanceProvider } from "@/contexts/FinanceContext";

export const metadata: Metadata = {
  title: "MiCartera",
  description: "Gestión de deudas y pagos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <FinanceProvider>
          {children}
        </FinanceProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                  console.log('Unregistered old service worker');
                }
                if (registrations.length > 0 && !sessionStorage.getItem('sw_reloaded')) {
                  sessionStorage.setItem('sw_reloaded', 'true');
                  window.location.reload();
                }
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
