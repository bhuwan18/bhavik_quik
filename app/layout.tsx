import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Quizlet ${new Date().getFullYear()}`,
  description: "The ultimate quiz & collectible experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} antialiased min-h-screen`} style={{ background: "var(--background)", color: "#f0f0ff" }}>
        <SessionProvider>{children}</SessionProvider>

      </body>
    </html>
  );
}
