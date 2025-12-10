import { pool } from "@/lib/database";

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

export async function getBanners(): Promise<Banner[]> {
  try {
    const result = await pool.query(
      "SELECT * FROM banners WHERE is_active = true ORDER BY position, created_at DESC"
    );
    // Parse partial_links from JSON if it exists
    return result.rows.map((row) => ({
      ...row,
      partial_links: row.partial_links
        ? typeof row.partial_links === "string"
          ? JSON.parse(row.partial_links)
          : row.partial_links
        : null,
    }));
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

interface SiteIdentity {
  id: number | null;
  site_title: string;
  site_subtitle: string;
  logo_text: string;
  logo_initials: string;
  meta_title: string;
  meta_description: string;
  logo_url: string | null;
  favicon_url: string | null;
}

export async function getSiteIdentity(): Promise<SiteIdentity> {
  try {
    const result = await pool.query(
      "SELECT * FROM site_identity ORDER BY id LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      // Return default values if no record exists
      return {
        id: null,
        site_title: "Network Monitoring & Diagnostics",
        site_subtitle: "Check availability of websites, servers, hosts and IP addresses from multiple locations worldwide",
        logo_text: "Check Host",
        logo_initials: "CH",
        meta_title: "Check Host - Network Monitoring & Diagnostics",
        meta_description: "Online tool for checking availability of websites, servers, hosts and IP addresses",
        logo_url: null,
        favicon_url: null,
      };
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching site identity:", error);
    // Return default values on error
    return {
      id: null,
      site_title: "Network Monitoring & Diagnostics",
      site_subtitle: "Check availability of websites, servers, hosts and IP addresses from multiple locations worldwide",
      logo_text: "Check Host",
      logo_initials: "CH",
      meta_title: "Check Host - Network Monitoring & Diagnostics",
      meta_description: "Online tool for checking availability of websites, servers, hosts and IP addresses",
      logo_url: null,
      favicon_url: null,
    };
  }
}

