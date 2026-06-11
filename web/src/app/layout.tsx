import type { Metadata } from "next";
import { ClerkProvider, Show } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Internship Fit & Skill-Gap Analyzer",
  description:
    "Future hosted web app for comparing resume skills against internship postings and tracking skill gaps.",
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
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">
          <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <Link href="/" className="block">
                  <p className="text-sm font-medium text-sky-700">
                    Internship Fit &amp; Skill-Gap Analyzer
                  </p>
                  <p className="text-sm text-zinc-500">Hosted web app</p>
                </Link>
              </div>
              <nav className="flex flex-wrap items-center gap-4 text-sm">
                <Link
                  href="/"
                  className="font-medium text-zinc-700 hover:text-zinc-900"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="font-medium text-zinc-700 hover:text-zinc-900"
                >
                  Dashboard
                </Link>
                <Show when="signed-out">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/sign-in"
                      className="rounded-md border border-zinc-200 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="rounded-md bg-sky-700 px-3 py-1.5 font-medium text-white hover:bg-sky-800"
                    >
                      Sign up
                    </Link>
                  </div>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </nav>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
