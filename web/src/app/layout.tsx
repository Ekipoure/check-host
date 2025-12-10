import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BannerDisplay from "@/components/BannerDisplay";
import { getBanners, getSiteIdentity } from "@/components/BannerServer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteIdentity = await getSiteIdentity();
  return {
    title: siteIdentity.meta_title,
    description: siteIdentity.meta_description,
    // Next.js automatically uses icon.png from app directory
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const banners = await getBanners();

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} antialiased bg-white dark:bg-slate-900`}>
        <BannerDisplay initialBanners={banners} />
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
