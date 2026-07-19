import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { portfolioData } from "./data/portfolio-content";
import { CANONICAL_URL } from "./lib/site";
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
  metadataBase: new URL(CANONICAL_URL),
  title: portfolioData.bio.seoTitle,
  description: portfolioData.bio.seoDescription,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: portfolioData.bio.seoTitle,
    description: portfolioData.bio.seoDescription,
    url: "/",
    siteName: portfolioData.bio.name,
    type: "profile",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: portfolioData.bio.seoTitle,
    description: portfolioData.bio.seoDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
