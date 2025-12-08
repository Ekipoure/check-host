import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, username, password_hash FROM admins WHERE username = $1",
        [username]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid username or password" },
          { status: 401 }
        );
      }

      const admin = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: "Invalid username or password" },
          { status: 401 }
        );
      }

      // Create session token (simple approach - in production use JWT)
      const sessionToken = Buffer.from(`${admin.id}:${Date.now()}`).toString("base64");
      
      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

