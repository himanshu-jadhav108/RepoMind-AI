import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RepoMind AI — Autonomous Engineering Workspace",
  description:
    "Transform any public GitHub repository into a fully analyzed, explained, and improvable engineering artifact using a multi-agent AI team.",
  icons: {
    icon: "/RepoMind_AI_logo.jpeg",
    shortcut: "/RepoMind_AI_logo.jpeg",
    apple: "/RepoMind_AI_logo.jpeg",
  },
  openGraph: {
    title: "RepoMind AI — Your Autonomous Engineering Team",
    description: "10 AI agents analyze any GitHub repo in minutes. Architecture audit, security scan, performance review, and interactive 3D knowledge graph.",
    type: "website",
  },
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
