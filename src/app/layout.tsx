import type { Metadata } from "next";
import { GameProvider } from "@/contexts/GameContext";
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
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
