"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Advertisement {
  id: number;
  title: string | null;
  file_type: "image" | "gif";
  file_url: string;
  link_url: string | null;
  position: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  is_active: boolean;
  display_order: number;
}

interface AdvertisementDisplayProps {
  position?: "below_table" | "above_table";
}

export default function AdvertisementDisplay({ position = "below_table" }: AdvertisementDisplayProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);

  useEffect(() => {
    const loadAdvertisements = async () => {
      try {
        const response = await fetch("/api/advertisements");
        const data = await response.json();
        if (data.success && data.advertisements) {
          const activeAds = data.advertisements
            .filter((ad: Advertisement) => ad.is_active)
            .filter((ad: Advertisement) => ad.position === position)
            .sort((a: Advertisement, b: Advertisement) => a.display_order - b.display_order);
          setAdvertisements(activeAds);
        }
      } catch (error) {
        console.error("Error loading advertisements:", error);
      }
    };

    loadAdvertisements();
    
    // Refresh advertisements every 30 seconds
    const interval = setInterval(loadAdvertisements, 30000);
    return () => clearInterval(interval);
  }, [position]);

  if (advertisements.length === 0) {
    return null;
  }

  // Different styles for different positions
  const getBoxClasses = () => {
    const spacing = position === "above_table" ? "mt-6 sm:mt-8 mb-6 sm:mb-8" : "mt-6 sm:mt-8";
    return `w-full bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${spacing}`;
  };

  return (
    <div data-ad-position={position} className="w-full">
      <div className={getBoxClasses()}>
        {advertisements.map((ad) => {
          const adContent = (
            <div className="w-full">
              {ad.title && (
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 sm:mb-2 text-center px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
                  {ad.title}
                </h3>
              )}
              <img
                src={ad.file_url}
                alt={ad.alt_text || ad.title || "Advertisement"}
                className="block h-auto max-h-[150px] object-cover rounded-b-xl sm:rounded-b-2xl hover:opacity-90 transition-opacity"
                style={{ width: 'calc(100% + 2px)', maxWidth: 'calc(100% + 2px)', marginLeft: '-1px', marginRight: '-1px' }}
              />
            </div>
          );

          return (
            <div key={ad.id} className="w-full">
              {ad.link_url ? (
                <Link
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  {adContent}
                </Link>
              ) : (
                adContent
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

