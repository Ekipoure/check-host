import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BannerDisplay from "@/components/BannerDisplay";
import { getBanners } from "@/components/BannerServer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Check Host - Network Monitoring & Diagnostics",
  description: "Online tool for checking availability of websites, servers, hosts and IP addresses",
};

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
