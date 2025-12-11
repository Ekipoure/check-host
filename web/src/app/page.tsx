"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const services = [
  {
    title: "اطلاعات IP",
    description: "دریافت اطلاعات جغرافیایی آدرس IP یا نام میزبان: کشور، منطقه، شهر، منطقه زمانی، ISP و سازمان",
    href: "/ip-info",
    icon: "🌐",
    gradient: "from-blue-500 to-cyan-500",
    features: ["موقعیت جغرافیایی", "اطلاعات ISP", "منطقه زمانی", "ASN"],
  },
  {
    title: "Ping",
    description: "تست دسترسی به میزبان، اندازه‌گیری تاخیر شبکه و از دست رفتن بسته از سرورهای مختلف در سراسر جهان",
    href: "/ping",
    icon: "📡",
    gradient: "from-purple-500 to-pink-500",
    features: ["تاخیر", "از دست رفتن بسته", "سرورهای جهانی", "زمان واقعی"],
  },
  {
    title: "HTTP",
    description: "بررسی عملکرد و در دسترس بودن پاسخ وب‌سایت از کشورها و مراکز داده مختلف",
    href: "/http",
    icon: "🌍",
    gradient: "from-green-500 to-emerald-500",
    features: ["زمان پاسخ", "کد وضعیت", "بررسی جهانی", "هدرها"],
  },
  {
    title: "DNS",
    description: "دریافت رکوردهای A، AAAA و PTR همراه با TTL از سرورهای نام در سراسر جهان",
    href: "/dns",
    icon: "🔍",
    gradient: "from-orange-500 to-red-500",
    features: ["رکوردهای A", "رکوردهای AAAA", "رکوردهای PTR", "اطلاعات TTL"],
  },
  {
    title: "پورت TCP",
    description: "بررسی امکان اتصال TCP به پورت مشخص شده میزبان",
    href: "/tcp",
    icon: "🔌",
    gradient: "from-indigo-500 to-purple-500",
    features: ["وضعیت پورت", "تست اتصال", "چند پورت", "تایم‌اوت"],
  },
  {
    title: "پورت UDP",
    description: "بررسی امکان ارتباط از طریق پروتکل UDP با استفاده از پورت مشخص شده میزبان",
    href: "/udp",
    icon: "📡",
    gradient: "from-teal-500 to-cyan-500",
    features: ["تست UDP", "بررسی پورت", "زمان پاسخ", "قابلیت اطمینان"],
  },
];

const STORAGE_KEY = "check-ip-host-value";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [siteIdentity, setSiteIdentity] = useState({
    site_title: "نظارت و تشخیص شبکه",
    site_subtitle: "بررسی در دسترس بودن وب‌سایت‌ها، سرورها، میزبان‌ها و آدرس‌های IP از مکان‌های مختلف در سراسر جهان",
  });
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue) {
      setSearchValue(storedValue);
    }
  }, []);

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

    // Load site identity
    fetch("/api/site-identity")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.siteIdentity) {
          setSiteIdentity({
            site_title: data.siteIdentity.site_title || "نظارت و تشخیص شبکه",
            site_subtitle: data.siteIdentity.site_subtitle || "بررسی در دسترس بودن وب‌سایت‌ها، سرورها، میزبان‌ها و آدرس‌های IP از مکان‌های مختلف در سراسر جهان",
          });
        }
      })
      .catch(() => {
        // Use default values on error
      });
  }, []);

  // Save searchValue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (searchValue.trim()) {
        localStorage.setItem(STORAGE_KEY, searchValue);
      } else {
        // Remove from localStorage if cleared
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [searchValue]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setIsLoading(true);
    // Navigate to IP info page with the search value
    router.push(`/ip-info?host=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Search Box */}
      <section className="relative overflow-hidden py-6 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-6 lg:px-8">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)] -z-10" />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-10 md:mb-12 animate-fade-in">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-4 px-2 leading-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {siteIdentity.site_title}
            </h1>
            <p className="text-xs sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
              {siteIdentity.site_subtitle}
            </p>
          </div>

          {/* Modern Search Box */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <form onSubmit={handleSearch} className="relative">
              {/* Glowing Background Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg sm:rounded-xl md:rounded-2xl blur-lg opacity-30 transition-opacity duration-300 ${isFocused ? 'opacity-50' : ''}`} />
              
              {/* Main Search Container */}
              <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg sm:rounded-xl md:rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-1 sm:p-1.5 md:p-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search Icon and Input Container */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Search Icon */}
                    <div className="flex-shrink-0 pl-2 sm:pl-3 md:pl-4">
                      <svg 
                        className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-colors duration-300 ${isFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Input Field */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="آدرس IP، نام میزبان یا دامنه را وارد کنید"
                      className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm md:text-base lg:text-lg py-2 sm:py-2.5 md:py-3 lg:py-4 pr-1 sm:pr-2 min-w-0"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    disabled={!isMounted || isLoading || !searchValue.trim()}
                    className="flex-shrink-0 w-full sm:w-auto px-4 sm:px-5 md:px-6 lg:px-8 py-2.5 sm:py-2.5 md:py-3 lg:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg group text-xs sm:text-sm md:text-base min-h-[44px] sm:min-h-0"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden xs:inline">در حال بررسی...</span>
                        <span className="xs:hidden">...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <span>بررسی</span>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-2.5 sm:mt-3 md:mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2 px-1 sm:px-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("8.8.8.8");
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-md sm:rounded-lg hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50 min-h-[36px] sm:min-h-[44px]"
                >
                  Try: 8.8.8.8
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("google.com");
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-md sm:rounded-lg hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50 min-h-[36px] sm:min-h-[44px]"
                >
                  Try: google.com
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("github.com");
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-md sm:rounded-lg hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50 min-h-[36px] sm:min-h-[44px]"
                >
                  Try: github.com
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {services.map((service, index) => (
              <Link
                key={service.href}
                href={service.href}
                className="group relative bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[140px] sm:min-h-[160px]"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-2 sm:mb-3 md:mb-4">
                    <span className="text-2xl sm:text-3xl md:text-4xl mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0">{service.icon}</span>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 md:mb-4 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all duration-200">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 text-slate-800 dark:text-slate-200 px-2 sm:px-4 leading-tight">
            چرا Check Host را انتخاب کنیم؟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <span className="text-xl sm:text-2xl md:text-3xl">⚡</span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2 text-slate-800 dark:text-slate-200">سریع و قابل اعتماد</h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed px-1">
                دریافت نتایج فوری از شبکه جهانی سرورهای نظارتی ما
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <span className="text-xl sm:text-2xl md:text-3xl">🌍</span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2 text-slate-800 dark:text-slate-200">پوشش جهانی</h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed px-1">
                تست از مکان‌های مختلف در سراسر جهان برای نتایج دقیق
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <span className="text-xl sm:text-2xl md:text-3xl">🔒</span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2 text-slate-800 dark:text-slate-200">امن و خصوصی</h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed px-1">
                اطلاعات شما در امان است. ما اطلاعات حساس را ذخیره نمی‌کنیم
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
