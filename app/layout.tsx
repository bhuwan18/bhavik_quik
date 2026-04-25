import type { Metadata } from "next";
import { Nunito, Rubik } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import ThemeProvider from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const jakarta = Nunito({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700"] });
const grotesk = Rubik({ subsets: ["latin"], variable: "--font-grotesk", weight: ["700", "800"] });

export const metadata: Metadata = {
  title: "BittsQuiz",
  description: "Answer quizzes, earn coins, and collect rare Quizlet characters. The ultimate quiz & collectible experience!",
  verification: {
    google: "YkJoNwZuKpoBjCyy-Xa5DStNjD3_BmH5TdXEvo3auLI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${grotesk.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
