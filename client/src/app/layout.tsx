import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAMP",
  description: "Learning & Assessment Management Portal",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-100">
        {children}
      </body>
    </html>
  );
}