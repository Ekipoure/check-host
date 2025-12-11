import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BannerDisplay from "@/components/BannerDisplay";
import { getBanners, getSiteIdentity } from "@/components/BannerServer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeScript } from "@/components/ThemeScript";

const vazirmatn = Vazirmatn({
  subsets: ["latin", "arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
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
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased bg-white text-slate-900 font-sans transition-colors duration-200 dark:bg-slate-900 dark:text-slate-100">
        <ThemeScript />
        <ThemeProvider>
          <BannerDisplay initialBanners={banners} />
          <Navigation />
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
