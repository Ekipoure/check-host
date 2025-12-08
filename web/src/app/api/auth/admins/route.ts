import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Helper function to verify admin authentication
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
  } catch {
    return null;
  }
}

// GET - List all admins
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, username, display_order, created_at, updated_at FROM admins ORDER BY display_order ASC, created_at DESC"
      );

      return NextResponse.json({
        success: true,
        admins: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Get admins error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if username already exists
      const existing = await client.query(
        "SELECT id FROM admins WHERE username = $1",
        [username]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: "Username already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert new admin
      const result = await client.query(
        "INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at",
        [username, passwordHash]
      );

      return NextResponse.json({
        success: true,
        admin: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create admin" },
      { status: 500 }
    );
  }
}

// PUT - Update admin (username or password)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, username, password, displayOrder } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Admin ID is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if admin exists
      const existing = await client.query(
        "SELECT id, username FROM admins WHERE id = $1",
        [id]
      );

      if (existing.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Admin not found" },
          { status: 404 }
        );
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (displayOrder !== undefined) {
        updates.push(`display_order = $${paramCount++}`);
        values.push(displayOrder);
      }

      if (username) {
        // Check if new username already exists (excluding current admin)
        const usernameCheck = await client.query(
          "SELECT id FROM admins WHERE username = $1 AND id != $2",
          [username, id]
        );

        if (usernameCheck.rows.length > 0) {
          return NextResponse.json(
            { success: false, error: "Username already exists" },
            { status: 400 }
          );
        }

        updates.push(`username = $${paramCount++}`);
        values.push(username);
      }

      if (password) {
        if (password.length < 6) {
          return NextResponse.json(
            { success: false, error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }

        const passwordHash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${paramCount++}`);
        values.push(passwordHash);
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { success: false, error: "No fields to update" },
          { status: 400 }
        );
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `UPDATE admins SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, username, updated_at`;
      
      const result = await client.query(query, values);

      return NextResponse.json({
        success: true,
        admin: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update admin" },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (parseInt(id) === admin.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if admin exists
      const existing = await client.query(
        "SELECT id FROM admins WHERE id = $1",
        [id]
      );

      if (existing.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Admin not found" },
          { status: 404 }
        );
      }

      // Check if this is the last admin
      const countResult = await client.query("SELECT COUNT(*) FROM admins");
      const adminCount = parseInt(countResult.rows[0].count);

      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin" },
          { status: 400 }
        );
      }

      await client.query("DELETE FROM admins WHERE id = $1", [id]);

      return NextResponse.json({
        success: true,
        message: "Admin deleted successfully",
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete admin" },
      { status: 500 }
    );
  }
}

