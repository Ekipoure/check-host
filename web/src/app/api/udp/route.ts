import { NextRequest, NextResponse } from "next/server";
import { callAllAgents } from "@/lib/worker-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const host = searchParams.get("host");
  const port = searchParams.get("port") || "53";

  if (!host) {
    return NextResponse.json({ error: "Host parameter is required" }, { status: 400 });
  }

  try {
    const results = await callAllAgents("udp", host, {
      port: parseInt(port),
    });
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error checking UDP port:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check UDP port" },
      { status: 500 }
    );
  }
}

