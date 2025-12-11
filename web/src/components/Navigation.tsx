"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { name: "اطلاعات IP", href: "/ip-info", icon: "🌐" },
  { name: "Ping", href: "/ping", icon: "📡" },
  { name: "HTTP", href: "/http", icon: "🌍" },
  { name: "DNS", href: "/dns", icon: "🔍" },
  { name: "پورت TCP", href: "/tcp", icon: "🔌" },
  { name: "پورت UDP", href: "/udp", icon: "📡" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const defaultLogoUrl = "/uploads/site-identity/favicon-1765353943561-u51tipycn.png";
  const previousLogoUrlRef = useRef<string | null>(defaultLogoUrl);
  const [siteIdentity, setSiteIdentity] = useState({
    logo_text: "Pishdad",
    logo_slogan: "",
    logo_url: defaultLogoUrl,
  });

  useEffect(() => {
    // Check if user is admin
    fetch("/api/auth/verify")
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.success && data.authenticated);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [pathname]);

  useEffect(() => {
    // Load site identity - only once on mount
    fetch("/api/site-identity")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.siteIdentity) {
          const newLogoUrl = data.siteIdentity.logo_url || defaultLogoUrl;
          const previousLogoUrl = previousLogoUrlRef.current;
          
          setSiteIdentity({
            logo_text: data.siteIdentity.logo_text || "Pishdad",
            logo_slogan: data.siteIdentity.logo_slogan || "",
            logo_url: newLogoUrl,
          });
          
          // Set current logo URL to try loading
          setCurrentLogoUrl(newLogoUrl);
          
          // Only reset states if URL actually changed
          if (newLogoUrl !== previousLogoUrl) {
            setLogoError(false);
            setLogoLoaded(false);
            previousLogoUrlRef.current = newLogoUrl;
          }
        }
      })
      .catch((error) => {
        console.error("Error loading site identity:", error);
        // Use default logo on error
        setCurrentLogoUrl(defaultLogoUrl);
      });
  }, []); // Empty dependency array - only load once

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0 flex-shrink">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0 flex items-center justify-center relative">
              {(() => {
                const logoUrlToUse = currentLogoUrl || siteIdentity.logo_url;
                if (logoUrlToUse && !logoError) {
                  return (
                    <img
                      key={logoUrlToUse}
                      src={logoUrlToUse}
                      alt={siteIdentity.logo_text}
                      className="w-full h-full object-contain"
                      style={{
                        imageRendering: 'auto',
                        filter: 'contrast(1.05) saturate(1.1)',
                      }}
                      loading="eager"
                      onLoad={() => {
                        setLogoLoaded(true);
                        setLogoError(false);
                      }}
                      onError={() => {
                        const failedUrl = logoUrlToUse;
                        console.warn("Logo image failed to load:", failedUrl);
                        
                        // If the failed URL is not the default, try the default
                        if (failedUrl !== defaultLogoUrl) {
                          console.log("Trying default logo:", defaultLogoUrl);
                          setCurrentLogoUrl(defaultLogoUrl);
                          setLogoError(false);
                          setLogoLoaded(false);
                        } else {
                          // Both URLs failed, show fallback
                          setLogoError(true);
                          setLogoLoaded(false);
                        }
                      }}
                    />
                  );
                }
                return null;
              })()}
              {logoError && (!currentLogoUrl || currentLogoUrl === defaultLogoUrl) ? (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base shadow-md absolute inset-0">
                  {siteIdentity.logo_text && siteIdentity.logo_text.length > 0
                    ? siteIdentity.logo_text.charAt(0).toUpperCase()
                    : "P"}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                {siteIdentity.logo_text}
              </span>
              {siteIdentity.logo_slogan && (
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  {siteIdentity.logo_slogan}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 lg:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="mr-1 sm:mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && pathname !== "/dashboard" && !pathname?.startsWith("/dashboard") && (
              <Link
                href="/dashboard"
                className="px-3 lg:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <span className="mr-1 sm:mr-2">⚙️</span>
                داشبورد
              </Link>
            )}
            <ThemeToggle />
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="px-3 lg:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                خروج
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 sm:pb-4 space-y-1 animate-fade-in">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && pathname !== "/dashboard" && !pathname?.startsWith("/dashboard") && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <span className="mr-2">⚙️</span>
                داشبورد
              </Link>
            )}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تم نمایش:</span>
                <ThemeToggle />
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                خروج
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

