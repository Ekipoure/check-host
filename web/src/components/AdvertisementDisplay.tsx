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
  const getContainerClasses = () => {
    return "max-w-6xl mx-auto mt-8 animate-fade-in";
  };

  const getBoxClasses = () => {
    return "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden";
  };

  const getContentClasses = () => {
    return "px-6 py-4 flex flex-wrap justify-center gap-4";
  };

  return (
    <div className={getContainerClasses()} data-ad-position={position}>
      <div className={getBoxClasses()}>
        <div className={getContentClasses()}>
          {advertisements.map((ad) => {
            const adContent = (
              <div>
                {ad.title && (
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 text-center">
                    {ad.title}
                  </h3>
                )}
                <img
                  src={ad.file_url}
                  alt={ad.alt_text || ad.title || "Advertisement"}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
                  style={{
                    maxWidth: ad.width ? `${ad.width}px` : "100%",
                    maxHeight: ad.height ? `${ad.height}px` : "auto",
                    width: ad.width ? `${ad.width}px` : "auto",
                    height: ad.height ? `${ad.height}px` : "auto",
                  }}
                />
              </div>
            );

            return (
              <div key={ad.id} className="flex justify-center">
                {ad.link_url ? (
                  <Link
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
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
    </div>
  );
}

