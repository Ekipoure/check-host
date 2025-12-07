import { NextRequest, NextResponse } from "next/server";
import { callAllAgents } from "@/lib/worker-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const host = searchParams.get("host");
  const type = searchParams.get("type") || "A";

  if (!host) {
    return NextResponse.json({ error: "Host parameter is required" }, { status: 400 });
  }

  try {
    const results = await callAllAgents("dns", host, {
      type: type,
    });
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error checking DNS:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check DNS" },
      { status: 500 }
    );
  }
}

