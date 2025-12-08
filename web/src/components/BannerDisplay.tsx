"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface PartialLink {
  text: string;
  url: string;
  color?: string;
}

interface Banner {
  id: number;
  text: string;
  text_color: string;
  background_color: string;
  has_background: boolean;
  font_size: number;
  animation_duration: number;
  link_url: string | null;
  partial_links: PartialLink[] | null;
  position: "top" | "bottom";
  is_active: boolean;
}

interface BannerDisplayProps {
  initialBanners?: Banner[];
}

export default function BannerDisplay({ initialBanners = [] }: BannerDisplayProps) {
  const [topBanners, setTopBanners] = useState<Banner[]>(
    initialBanners.filter((b) => b.position === "top")
  );
  const [bottomBanners, setBottomBanners] = useState<Banner[]>(
    initialBanners.filter((b) => b.position === "bottom")
  );
  const bannerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch("/api/banners");
        const data = await response.json();
        if (data.success && data.banners) {
          const activeBanners = data.banners.filter((b: Banner) => b.is_active);
          setTopBanners(activeBanners.filter((b: Banner) => b.position === "top"));
          setBottomBanners(activeBanners.filter((b: Banner) => b.position === "bottom"));
        }
      } catch (error) {
        console.error("Error loading banners:", error);
      }
    };

    // Only fetch if no initial banners provided
    if (initialBanners.length === 0) {
      loadBanners();
    }
    
    // Refresh banners every 30 seconds
    const interval = setInterval(loadBanners, 30000);
    return () => clearInterval(interval);
  }, [initialBanners.length]);

  // Function to process text and convert partial links
  const processTextWithLinks = (text: string, partialLinks: PartialLink[] | null, textStyle: React.CSSProperties) => {
    if (!partialLinks || partialLinks.length === 0) {
      return <span style={textStyle}>{text}</span>;
    }

    // Create a map of all link positions
    const linkPositions: Array<{ start: number; end: number; link: PartialLink; index: number }> = [];
    
    partialLinks.forEach((link, linkIndex) => {
      let searchStart = 0;
      while (true) {
        const index = text.indexOf(link.text, searchStart);
        if (index === -1) break;
        linkPositions.push({
          start: index,
          end: index + link.text.length,
          link,
          index: linkIndex,
        });
        searchStart = index + 1;
      }
    });

    // Sort by start position
    linkPositions.sort((a, b) => a.start - b.start);

    // Build the result
    const elements: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    linkPositions.forEach((pos, posIndex) => {
      // Add text before this link
      if (pos.start > lastIndex) {
        elements.push(text.substring(lastIndex, pos.start));
      }
      
      // Add the link
      const linkColor = pos.link.color || textStyle.color || "#0000EE"; // Default to blue if no color specified
      elements.push(
        <Link
          key={`link-${pos.index}-${posIndex}`}
          href={pos.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{ textDecoration: "none", color: linkColor }}
        >
          {pos.link.text}
        </Link>
      );
      
      lastIndex = pos.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return <span style={textStyle}>{elements}</span>;
  };

  const BannerItem = ({ banner }: { banner: Banner }) => {
    const animationName = `banner-scroll-${banner.id}`;
    const className = `banner-content-${banner.id}`;

    const textStyle: React.CSSProperties = {
      color: banner.text_color,
      fontSize: `${banner.font_size}px`,
      lineHeight: "1.5",
      display: "inline-block",
    };

    const bannerStyle: React.CSSProperties = {
      backgroundColor: banner.has_background ? banner.background_color : "transparent",
      padding: "8px 0",
      overflow: "hidden",
      position: "relative",
      whiteSpace: "nowrap",
    };

    // Process content with partial links if available, otherwise use full link or plain text
    const content = banner.partial_links && banner.partial_links.length > 0
      ? processTextWithLinks(banner.text, banner.partial_links, textStyle)
      : banner.link_url
      ? (
          <Link
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
            style={{ textDecoration: "none", ...textStyle }}
          >
            {banner.text}
          </Link>
        )
      : (
          <span style={textStyle}>{banner.text}</span>
        );

    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes ${animationName} {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
            .${className} {
              display: inline-block;
              animation: ${animationName} ${banner.animation_duration}s linear infinite;
              padding-right: 100%;
            }
          `
        }} />
        <div 
          ref={(el) => { bannerRefs.current[banner.id] = el; }}
          style={bannerStyle} 
          className="w-full"
          data-banner-id={banner.id}
        >
          <div className="flex">
            <div className={className} style={{ minWidth: "max-content" }}>
              {content}
            </div>
            <div className={className} style={{ minWidth: "max-content" }}>
              {content}
            </div>
          </div>
        </div>
      </>
    );
  };

  // Calculate heights and update positions
  useEffect(() => {
    const calculateHeights = () => {
      let topHeight = 0;
      let bottomHeight = 0;

      // Calculate top banners height
      topBanners.forEach((banner) => {
        const element = bannerRefs.current[banner.id];
        if (element) {
          topHeight += element.offsetHeight;
        } else {
          // Fallback: estimate based on font size + padding
          topHeight += Math.max(banner.font_size * 1.5, 32) + 16;
        }
      });

      // Calculate bottom banners height
      bottomBanners.forEach((banner) => {
        const element = bannerRefs.current[banner.id];
        if (element) {
          bottomHeight += element.offsetHeight;
        } else {
          // Fallback: estimate based on font size + padding
          bottomHeight += Math.max(banner.font_size * 1.5, 32) + 16;
        }
      });

      // Navigation height is 64px (4rem)
      const navigationHeight = 64;

      // Update Navigation position (below top banners)
      const nav = document.querySelector('nav');
      if (nav) {
        nav.style.top = `${topHeight}px`;
      }

      // Update bottom banners position (below Navigation)
      const bottomBannerContainer = document.querySelector('[data-banner-position="bottom"]');
      if (bottomBannerContainer) {
        (bottomBannerContainer as HTMLElement).style.top = `${topHeight + navigationHeight}px`;
      }

      // Update main padding
      const totalHeight = topHeight + navigationHeight + bottomHeight;
      const main = document.querySelector('main');
      if (main) {
        main.style.paddingTop = `${totalHeight}px`;
      }
    };

    // Calculate after render
    const timeout = setTimeout(calculateHeights, 0);
    
    // Also recalculate when banners change
    calculateHeights();

    // Recalculate on window resize
    window.addEventListener('resize', calculateHeights);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', calculateHeights);
    };
  }, [topBanners, bottomBanners]);

  return (
    <>
      {topBanners.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[60]" data-banner-position="top">
          {topBanners.map((banner) => (
            <BannerItem key={banner.id} banner={banner} />
          ))}
        </div>
      )}
      {bottomBanners.length > 0 && (
        <div className="fixed left-0 right-0 z-[60]" data-banner-position="bottom">
          {bottomBanners.map((banner) => (
            <BannerItem key={banner.id} banner={banner} />
          ))}
        </div>
      )}
    </>
  );
}

