import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
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
  title: {
    default: "Job Fit & Skill-Gap Analyzer",
    template: "%s | Job Fit & Skill-Gap Analyzer",
  },
  description:
    "Rule-based career planning workspace for comparing resume skills with job descriptions, reviewing skill gaps, and working with structured saved results.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      >
        <body className="min-h-full overflow-x-hidden font-sans">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
              {children}
            </div>
            <AppFooter />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
