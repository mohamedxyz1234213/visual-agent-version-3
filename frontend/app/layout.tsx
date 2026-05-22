import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whiteboard Teacher",
  description: "Upload any document or type a topic and get an interactive whiteboard lesson with animations, diagrams, and quizzes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,600;6..72,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
