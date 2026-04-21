import type { Metadata } from "next";
import { GameProvider } from "@/contexts/GameContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CrispChat from '@/components/crisp-chat'
import "./globals.css";

export const metadata: Metadata = {
  title: "TryOutfit - Virtual Try-On Tool",
  description: "Low-barrier, repeatable virtual try-on tool for pre-purchase reference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <GameProvider>
            {children}
            <CrispChat />
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
