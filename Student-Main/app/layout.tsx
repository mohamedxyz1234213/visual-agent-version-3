import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "CodeBuddy — AI Coding Teacher",
  description: "Learn to code with an AI-powered teacher",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} style={{ fontFamily: "var(--font-jakarta), system-ui, -apple-system, sans-serif" }} suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: "var(--font-jakarta), system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
