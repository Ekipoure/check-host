import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

// GET - Get all advertisements (public for active ones, admin for all)
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

      // Return all advertisements for admin
      const result = await pool.query(
        "SELECT * FROM advertisements ORDER BY display_order, created_at DESC"
      );
      return NextResponse.json({ success: true, advertisements: result.rows });
    } else {
      // Return only active advertisements for public
      const result = await pool.query(
        "SELECT * FROM advertisements WHERE is_active = true ORDER BY display_order, created_at DESC"
      );
      return NextResponse.json({ success: true, advertisements: result.rows });
    }
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advertisements" },
      { status: 500 }
    );
  }
}

// POST - Create a new advertisement
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const fileType = formData.get("file_type") as string;
    const fileUrl = formData.get("file_url") as string;
    const linkUrl = formData.get("link_url") as string;
    const position = formData.get("position") as string || "below_table";
    const width = formData.get("width") ? parseInt(formData.get("width") as string) : null;
    const height = formData.get("height") ? parseInt(formData.get("height") as string) : null;
    const altText = formData.get("alt_text") as string;
    const isActive = formData.get("is_active") === "true" || formData.get("is_active") === null;
    const displayOrder = formData.get("display_order") ? parseInt(formData.get("display_order") as string) : 0;
    const settingsJson = formData.get("settings") as string;
    const file = formData.get("file") as File | null;

    // Validate file type
    if (fileType !== "image" && fileType !== "gif") {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Must be 'image' or 'gif'" },
        { status: 400 }
      );
    }

    let finalFileUrl = fileUrl;
    let filePath = null;

    // Handle file upload
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate file extension
      const fileName = file.name;
      const fileExtension = fileName.split(".").pop()?.toLowerCase();
      const allowedExtensions = fileType === "gif" ? ["gif"] : ["jpg", "jpeg", "png", "webp", "gif"];
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { success: false, error: `Invalid file extension. Allowed: ${allowedExtensions.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads", "advertisements");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const uniqueFileName = `${timestamp}-${randomStr}.${fileExtension}`;
      const filePathOnDisk = join(uploadsDir, uniqueFileName);

      // Save file
      await writeFile(filePathOnDisk, buffer);

      // Set file URL and path
      finalFileUrl = `/uploads/advertisements/${uniqueFileName}`;
      filePath = filePathOnDisk;
    }

    // Validate that either file or file_url is provided
    if (!finalFileUrl && !file) {
      return NextResponse.json(
        { success: false, error: "Either file upload or file URL is required" },
        { status: 400 }
      );
    }

    // Parse settings
    let settings = null;
    if (settingsJson) {
      try {
        settings = JSON.parse(settingsJson);
      } catch (e) {
        console.warn("Invalid settings JSON, using null");
      }
    }

    const result = await pool.query(
      `INSERT INTO advertisements (
        title, file_type, file_url, file_path, link_url, position,
        width, height, alt_text, is_active, display_order, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        title || null,
        fileType,
        finalFileUrl,
        filePath,
        linkUrl || null,
        position,
        width,
        height,
        altText || null,
        isActive,
        displayOrder,
        settings ? JSON.stringify(settings) : null,
      ]
    );

    return NextResponse.json({
      success: true,
      advertisement: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error creating advertisement:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create advertisement" },
      { status: 500 }
    );
  }
}

