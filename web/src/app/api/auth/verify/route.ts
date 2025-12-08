import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    // Decode session token to get admin ID
    try {
      const decoded = Buffer.from(sessionToken, "base64").toString("utf-8");
      const [adminId] = decoded.split(":");

      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT id, username FROM admins WHERE id = $1",
          [adminId]
        );

        if (result.rows.length === 0) {
          return NextResponse.json(
            { success: false, authenticated: false },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          authenticated: true,
          admin: {
            id: result.rows[0].id,
            username: result.rows[0].username,
          },
        });
      } finally {
        client.release();
      }
    } catch (decodeError) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 500 }
    );
  }
}

