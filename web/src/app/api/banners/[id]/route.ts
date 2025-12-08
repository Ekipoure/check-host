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

// GET - Get a specific banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query("SELECT * FROM banners WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    // Parse partial_links from JSON
    const banner = {
      ...result.rows[0],
      partial_links: result.rows[0].partial_links
        ? typeof result.rows[0].partial_links === "string"
          ? JSON.parse(result.rows[0].partial_links)
          : result.rows[0].partial_links
        : null,
    };

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}

// PUT - Update a banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      textColor,
      backgroundColor,
      hasBackground,
      fontSize,
      animationDuration,
      linkUrl,
      partialLinks,
      position,
      isActive,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (text !== undefined) {
      if (!text || text.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Text cannot be empty" },
          { status: 400 }
        );
      }
      updates.push(`text = $${paramIndex++}`);
      values.push(text.trim());
    }
    if (textColor !== undefined) {
      updates.push(`text_color = $${paramIndex++}`);
      values.push(textColor);
    }
    if (backgroundColor !== undefined) {
      updates.push(`background_color = $${paramIndex++}`);
      values.push(backgroundColor);
    }
    if (hasBackground !== undefined) {
      updates.push(`has_background = $${paramIndex++}`);
      values.push(hasBackground);
    }
    if (fontSize !== undefined) {
      updates.push(`font_size = $${paramIndex++}`);
      values.push(fontSize);
    }
    if (animationDuration !== undefined) {
      updates.push(`animation_duration = $${paramIndex++}`);
      values.push(animationDuration);
    }
    if (linkUrl !== undefined) {
      updates.push(`link_url = $${paramIndex++}`);
      values.push(linkUrl || null);
    }
    if (partialLinks !== undefined) {
      updates.push(`partial_links = $${paramIndex++}`);
      values.push(partialLinks && partialLinks.length > 0 ? JSON.stringify(partialLinks) : null);
    }
    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(position);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (body.displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(body.displayOrder);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE banners SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

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
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      "DELETE FROM banners WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}

