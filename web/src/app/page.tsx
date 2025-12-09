"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const services = [
  {
    title: "IP Info",
    description: "Get geolocation data of IP address or hostname: country, region, city, timezone, ISP, and organization",
    href: "/ip-info",
    icon: "🌐",
    gradient: "from-blue-500 to-cyan-500",
    features: ["Geolocation", "ISP Info", "Timezone", "ASN"],
  },
  {
    title: "Ping",
    description: "Test the reachability of a host, measure network latency and packet loss from different servers worldwide",
    href: "/ping",
    icon: "📡",
    gradient: "from-purple-500 to-pink-500",
    features: ["Latency", "Packet Loss", "Global Servers", "Real-time"],
  },
  {
    title: "HTTP",
    description: "Check website's response performance and availability from many countries and datacenters",
    href: "/http",
    icon: "🌍",
    gradient: "from-green-500 to-emerald-500",
    features: ["Response Time", "Status Code", "Global Check", "Headers"],
  },
  {
    title: "DNS",
    description: "Retrieve A, AAAA, and PTR records with TTL from nameservers around the world",
    href: "/dns",
    icon: "🔍",
    gradient: "from-orange-500 to-red-500",
    features: ["A Records", "AAAA Records", "PTR Records", "TTL Info"],
  },
  {
    title: "TCP Port",
    description: "Check the possibility of a TCP connection to host's specified port",
    href: "/tcp",
    icon: "🔌",
    gradient: "from-indigo-500 to-purple-500",
    features: ["Port Status", "Connection Test", "Multiple Ports", "Timeout"],
  },
  {
    title: "UDP Port",
    description: "Check the possibility of communication over UDP protocol using host's specified port",
    href: "/udp",
    icon: "📡",
    gradient: "from-teal-500 to-cyan-500",
    features: ["UDP Test", "Port Check", "Response Time", "Reliability"],
  },
];

const STORAGE_KEY = "check-ip-host-value";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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
      <section className="relative overflow-hidden py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)] -z-10" />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 px-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Network Monitoring & Diagnostics
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
              Check availability of websites, servers, hosts and IP addresses from multiple locations worldwide
            </p>
          </div>

          {/* Modern Search Box */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <form onSubmit={handleSearch} className="relative">
              {/* Glowing Background Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl blur-lg opacity-30 transition-opacity duration-300 ${isFocused ? 'opacity-50' : ''}`} />
              
              {/* Main Search Container */}
              <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-1.5 sm:p-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search Icon and Input Container */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    {/* Search Icon */}
                    <div className="flex-shrink-0 pl-2 sm:pl-4">
                      <svg 
                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${isFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
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
                      placeholder="Enter IP address, hostname, or domain"
                      className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base md:text-lg py-2 sm:py-3 md:py-4 pr-2 min-w-0"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    disabled={!isMounted || isLoading || !searchValue.trim()}
                    className="flex-shrink-0 w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg group text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden xs:inline">Checking...</span>
                        <span className="xs:hidden">...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>Check</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2 px-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("8.8.8.8");
                    inputRef.current?.focus();
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50"
                >
                  Try: 8.8.8.8
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("google.com");
                    inputRef.current?.focus();
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50"
                >
                  Try: google.com
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("github.com");
                    inputRef.current?.focus();
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50"
                >
                  Try: github.com
                </button>
              </div>
            </form>
          </div>

          {/* Admin Dashboard Link */}
          {isAdmin && (
            <div className="text-center mt-6 sm:mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-lg sm:rounded-xl font-medium shadow-lg hover:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden sm:inline">Agent Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {services.map((service, index) => (
              <Link
                key={service.href}
                href={service.href}
                className="group relative bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <span className="text-3xl sm:text-4xl mr-2 sm:mr-3">{service.icon}</span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all duration-200">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 text-slate-800 dark:text-slate-200 px-4">
            Why Choose Check Host?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-5 md:p-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">⚡</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Fast & Reliable</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Get instant results from our global network of monitoring servers
              </p>
            </div>
            <div className="text-center p-4 sm:p-5 md:p-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">🌍</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Global Coverage</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Test from multiple locations worldwide for accurate results
              </p>
            </div>
            <div className="text-center p-4 sm:p-5 md:p-6 sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">🔒</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Secure & Private</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Your data is safe with us. We don't store sensitive information
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
