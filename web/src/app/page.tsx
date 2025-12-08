"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Network Monitoring & Diagnostics
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
              Online tool for checking availability of websites, servers, hosts and IP addresses.
              Get real-time insights from multiple locations worldwide.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/ip-info"
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-700 transform hover:scale-105 transition-all duration-200"
                >
                  Agent Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {services.map((service, index) => (
              <Link
                key={service.href}
                href={service.href}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <span className="text-4xl mr-3">{service.icon}</span>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="absolute bottom-6 right-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800 dark:text-slate-200">
            Why Choose Check Host?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Fast & Reliable</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Get instant results from our global network of monitoring servers
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Global Coverage</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Test from multiple locations worldwide for accurate results
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Secure & Private</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your data is safe with us. We don't store sensitive information
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
