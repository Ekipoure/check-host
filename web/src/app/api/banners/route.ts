import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { cookies } from "next/headers";

// Verify admin authentication
async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const decoded = Buffer.from(sessionToken, "base64").toString("utf-8");
    const [adminId] = decoded.split(":");

    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, username FROM admins WHERE id = $1",
        [adminId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error verifying admin:", error);
    return null;
  }
}

// GET - Get all banners (public for active ones, admin for all)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminOnly = searchParams.get("admin") === "true";

    if (adminOnly) {
      const admin = await verifyAdmin();
      if (!admin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Return all banners for admin
      const result = await pool.query(
        "SELECT * FROM banners ORDER BY display_order ASC, created_at DESC"
      );
      // Parse partial_links from JSON
      const banners = result.rows.map((row) => ({
        ...row,
        partial_links: row.partial_links
          ? typeof row.partial_links === "string"
            ? JSON.parse(row.partial_links)
            : row.partial_links
          : null,
      }));
      return NextResponse.json({ success: true, banners });
    } else {
      // Return only active banners for public
      const result = await pool.query(
        "SELECT * FROM banners WHERE is_active = true ORDER BY position, display_order ASC, created_at DESC"
      );
      // Parse partial_links from JSON
      const banners = result.rows.map((row) => ({
        ...row,
        partial_links: row.partial_links
          ? typeof row.partial_links === "string"
            ? JSON.parse(row.partial_links)
            : row.partial_links
          : null,
      }));
      return NextResponse.json({ success: true, banners });
    }
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// POST - Create a new banner
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      text,
      textColor = "#000000",
      backgroundColor = "",
      hasBackground = true,
      fontSize = 16,
      animationDuration = 20,
      linkUrl = "",
      partialLinks = [],
      position = "top",
      isActive = true,
    } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO banners (
        text, text_color, background_color, has_background, 
        font_size, animation_duration, link_url, partial_links, position, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        text.trim(),
        textColor,
        backgroundColor,
        hasBackground,
        fontSize,
        animationDuration,
        linkUrl || null,
        partialLinks && partialLinks.length > 0 ? JSON.stringify(partialLinks) : null,
        position,
        isActive,
      ]
    );

    // Parse partial_links from JSON
    const banner = {
      ...result.rows[0],
      partial_links: result.rows[0].partial_links
        ? typeof result.rows[0].partial_links === "string"
          ? JSON.parse(result.rows[0].partial_links)
          : result.rows[0].partial_links
        : null,
    };

    return NextResponse.json({
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

