import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
