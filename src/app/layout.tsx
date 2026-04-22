import type { Metadata } from "next";
import Script from "next/script";
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "wfp0nee5nx");`}
        </Script>
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
