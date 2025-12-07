import { NextRequest, NextResponse } from "next/server";
import { callAllAgents } from "@/lib/worker-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const host = searchParams.get("host");
  const count = searchParams.get("count") || "4";

  if (!host) {
    return NextResponse.json({ error: "Host parameter is required" }, { status: 400 });
  }

  try {
    const results = await callAllAgents("ping", host, {
      count: parseInt(count),
    });
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error pinging host:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ping host" },
      { status: 500 }
    );
  }
}

