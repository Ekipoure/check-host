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

