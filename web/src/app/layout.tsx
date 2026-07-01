import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/site-config";
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
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
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
