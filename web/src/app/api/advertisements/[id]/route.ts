import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { cookies } from "next/headers";
import { writeFile, mkdir, unlink } from "fs/promises";
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

// GET - Get a specific advertisement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query("SELECT * FROM advertisements WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, advertisement: result.rows[0] });
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advertisement" },
      { status: 500 }
    );
  }
}

// PUT - Update an advertisement
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

    // Get existing advertisement
    const existingResult = await pool.query(
      "SELECT * FROM advertisements WHERE id = $1",
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    const existing = existingResult.rows[0];

    // Check if request is FormData (file upload) or JSON
    const contentType = request.headers.get("content-type") || "";
    let updateData: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      updateData.title = formData.get("title") as string;
      updateData.fileType = formData.get("file_type") as string;
      updateData.fileUrl = formData.get("file_url") as string;
      updateData.linkUrl = formData.get("link_url") as string;
      updateData.position = formData.get("position") as string;
      updateData.width = formData.get("width") ? parseInt(formData.get("width") as string) : null;
      updateData.height = formData.get("height") ? parseInt(formData.get("height") as string) : null;
      updateData.altText = formData.get("alt_text") as string;
      updateData.isActive = formData.get("is_active") === "true";
      updateData.displayOrder = formData.get("display_order") ? parseInt(formData.get("display_order") as string) : null;
      updateData.settingsJson = formData.get("settings") as string;
      updateData.file = formData.get("file") as File | null;
    } else {
      const body = await request.json();
      updateData = { ...body };
    }

    // Handle file upload if provided
    let finalFileUrl = updateData.fileUrl !== undefined ? updateData.fileUrl : existing.file_url;
    let filePath = updateData.filePath !== undefined ? updateData.filePath : existing.file_path;

    if (updateData.file && updateData.file.size > 0) {
      // Delete old file if it exists and is a local file
      if (existing.file_path && existsSync(existing.file_path)) {
        try {
          await unlink(existing.file_path);
        } catch (error) {
          console.warn("Error deleting old file:", error);
        }
      }

      const bytes = await updateData.file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = updateData.file.name;
      const fileExtension = fileName.split(".").pop()?.toLowerCase();
      const fileType = updateData.fileType || existing.file_type;
      const allowedExtensions = fileType === "gif" ? ["gif"] : ["jpg", "jpeg", "png", "webp", "gif"];
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { success: false, error: `Invalid file extension. Allowed: ${allowedExtensions.join(", ")}` },
          { status: 400 }
        );
      }

      if (updateData.file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      const uploadsDir = join(process.cwd(), "public", "uploads", "advertisements");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const uniqueFileName = `${timestamp}-${randomStr}.${fileExtension}`;
      const filePathOnDisk = join(uploadsDir, uniqueFileName);

      await writeFile(filePathOnDisk, buffer);

      finalFileUrl = `/uploads/advertisements/${uniqueFileName}`;
      filePath = filePathOnDisk;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(updateData.title || null);
    }
    if (updateData.fileType !== undefined) {
      if (updateData.fileType !== "image" && updateData.fileType !== "gif") {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Must be 'image' or 'gif'" },
          { status: 400 }
        );
      }
      updates.push(`file_type = $${paramIndex++}`);
      values.push(updateData.fileType);
    }
    if (finalFileUrl !== existing.file_url) {
      updates.push(`file_url = $${paramIndex++}`);
      values.push(finalFileUrl);
    }
    if (filePath !== existing.file_path) {
      updates.push(`file_path = $${paramIndex++}`);
      values.push(filePath);
    }
    if (updateData.linkUrl !== undefined) {
      updates.push(`link_url = $${paramIndex++}`);
      values.push(updateData.linkUrl || null);
    }
    if (updateData.position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(updateData.position);
    }
    if (updateData.width !== undefined) {
      updates.push(`width = $${paramIndex++}`);
      values.push(updateData.width);
    }
    if (updateData.height !== undefined) {
      updates.push(`height = $${paramIndex++}`);
      values.push(updateData.height);
    }
    if (updateData.altText !== undefined) {
      updates.push(`alt_text = $${paramIndex++}`);
      values.push(updateData.altText || null);
    }
    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(updateData.isActive);
    }
    if (updateData.displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(updateData.displayOrder);
    }
    if (updateData.settingsJson !== undefined || updateData.settings !== undefined) {
      let settings = null;
      const settingsData = updateData.settingsJson || updateData.settings;
      if (settingsData) {
        try {
          settings = typeof settingsData === "string" ? JSON.parse(settingsData) : settingsData;
        } catch (e) {
          console.warn("Invalid settings JSON");
        }
      }
      updates.push(`settings = $${paramIndex++}`);
      values.push(settings ? JSON.stringify(settings) : null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE advertisements SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      advertisement: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error updating advertisement:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update advertisement" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an advertisement
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

    // Get advertisement to delete file
    const getResult = await pool.query("SELECT file_path FROM advertisements WHERE id = $1", [id]);
    
    if (getResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    const filePath = getResult.rows[0].file_path;

    // Delete the record
    const result = await pool.query(
      "DELETE FROM advertisements WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Delete the file if it exists
    if (filePath && existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (error) {
        console.warn("Error deleting file:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete advertisement" },
      { status: 500 }
    );
  }
}












