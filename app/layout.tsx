"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/shared/Navbar";
import ScrollAnimations from "@/components/shared/ScrollAnimations";
import SectionSnap from "@/components/shared/SectionSnap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Kean Garcia Portfolio</title>
        <meta name="description" content="Full-Stack Developer crafting clean, performant web experiences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SectionSnap />
          <ScrollAnimations />
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
