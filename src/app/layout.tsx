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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
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
                // Optionally reload once if a worker was unregistered
                if (registrations.length > 0) {
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
