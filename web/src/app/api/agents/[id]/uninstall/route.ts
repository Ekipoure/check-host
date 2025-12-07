import { NextRequest, NextResponse } from "next/server";
import { removeAgent } from "@/lib/agents-storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

    // TODO: Actually uninstall agent on server
    // For now, just remove from list
    await removeAgent(agentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uninstalling agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to uninstall agent" },
      { status: 500 }
    );
  }
}

