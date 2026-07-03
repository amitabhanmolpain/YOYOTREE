import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SHIELD // Scam URL & Message Checker",
  description: "Instantly check links and message text for scam attempts, phishing, typosquatting, or fraudulent content. Stay safe online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return React.createElement(
    "html",
    { lang: "en", className: `${geistSans.variable} ${geistMono.variable}` },
    React.createElement("body", null, children)
  );
}
