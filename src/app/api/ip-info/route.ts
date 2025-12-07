import { NextRequest, NextResponse } from "next/server";
import { callAllAgents } from "@/lib/worker-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const host = searchParams.get("host");

  if (!host) {
    return NextResponse.json({ error: "Host parameter is required" }, { status: 400 });
  }

  try {
    const results = await callAllAgents("ip-info", host, {});
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error fetching IP info:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch IP information" },
      { status: 500 }
    );
  }
}

