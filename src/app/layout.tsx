import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TimerProvider } from "@/contexts/TimerProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Mat Timer",
  description:
    "Cronómetro gratuito por rondas para academias de jiujitsu y MMA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <TimerProvider>{children}</TimerProvider>
      </body>
    </html>
  );
}
