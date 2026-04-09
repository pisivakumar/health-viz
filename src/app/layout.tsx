import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "10X Health — Precision Wellness",
  description: "Interactive health report visualization — powered by 10X Health",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
