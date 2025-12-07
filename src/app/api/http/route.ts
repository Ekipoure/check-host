import { NextRequest, NextResponse } from "next/server";
import { callAllAgents } from "@/lib/worker-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    const results = await callAllAgents("http", url, {});
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error checking HTTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check HTTP" },
      { status: 500 }
    );
  }
}

