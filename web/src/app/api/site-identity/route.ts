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

// GET - Get site identity (public)
export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      "SELECT * FROM site_identity ORDER BY id LIMIT 1"
    );

    if (result.rows.length === 0) {
      // Return default values if no record exists
      const defaultLogoText = "Check Host";
      const defaultSiteTitle = "Network Monitoring & Diagnostics";
      const defaultSiteSubtitle = "Check availability of websites, servers, hosts and IP addresses from multiple locations worldwide";
      return NextResponse.json({
        success: true,
        siteIdentity: {
          id: null,
          site_title: defaultSiteTitle,
          site_subtitle: defaultSiteSubtitle,
          logo_text: defaultLogoText,
          logo_slogan: "",
          meta_title: `${defaultLogoText} - ${defaultSiteTitle}`,
          meta_description: defaultSiteSubtitle,
        },
      });
    }

    // Generate meta fields if they don't exist
    const row = result.rows[0];
    const logoText = row.logo_text || "Check Host";
    const siteTitle = row.site_title || "Network Monitoring & Diagnostics";
    const siteSubtitle = row.site_subtitle || "Check availability of websites, servers, hosts and IP addresses from multiple locations worldwide";
    
    const metaTitle = row.meta_title || `${logoText} - ${siteTitle}`;
    const metaDescription = row.meta_description || siteSubtitle;

    return NextResponse.json({
      success: true,
      siteIdentity: {
        ...row,
        meta_title: metaTitle,
        meta_description: metaDescription,
      },
    });
  } catch (error) {
    console.error("Error fetching site identity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch site identity" },
      { status: 500 }
    );
  }
}

// PUT - Update site identity (admin only)
export async function PUT(request: NextRequest) {
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
      site_title,
      site_subtitle,
      logo_text,
      logo_slogan,
      meta_title,
      meta_description,
      logo_url,
      favicon_url,
    } = body;

    // Generate meta_title and meta_description automatically if not provided
    const finalLogoText = logo_text || "Check Host";
    const finalSiteTitle = site_title || "Network Monitoring & Diagnostics";
    const finalSiteSubtitle = site_subtitle || "Check availability of websites, servers, hosts and IP addresses from multiple locations worldwide";
    
    const finalMetaTitle = meta_title || `${finalLogoText} - ${finalSiteTitle}`;
    const finalMetaDescription = meta_description || finalSiteSubtitle;

    // Check if site identity exists
    const checkResult = await pool.query(
      "SELECT id FROM site_identity ORDER BY id LIMIT 1"
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new record
      result = await pool.query(
        `INSERT INTO site_identity (
          site_title, site_subtitle, logo_text, logo_slogan, meta_title, meta_description, logo_url, favicon_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          finalSiteTitle,
          finalSiteSubtitle,
          finalLogoText,
          logo_slogan || "",
          finalMetaTitle,
          finalMetaDescription,
          logo_url || null,
          favicon_url || null,
        ]
      );
    } else {
      // Update existing record - always update meta fields automatically
      result = await pool.query(
        `UPDATE site_identity SET
          site_title = COALESCE($1, site_title),
          site_subtitle = COALESCE($2, site_subtitle),
          logo_text = COALESCE($3, logo_text),
          logo_slogan = COALESCE($4, logo_slogan),
          meta_title = $5,
          meta_description = $6,
          logo_url = COALESCE($7, logo_url),
          favicon_url = COALESCE($8, favicon_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM site_identity ORDER BY id LIMIT 1)
        RETURNING *`,
        [
          site_title,
          site_subtitle,
          logo_text,
          logo_slogan,
          finalMetaTitle,
          finalMetaDescription,
          logo_url,
          favicon_url,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      siteIdentity: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating site identity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update site identity" },
      { status: 500 }
    );
  }
}

