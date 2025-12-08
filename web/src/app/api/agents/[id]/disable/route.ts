import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgent } from "@/lib/agents-storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getAgentById(id);
    
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // Only toggle visibility (hidden field)
    await updateAgent(id, { hidden: true, updatedAt: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      message: "Agent hidden successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to hide agent" },
      { status: 500 }
    );
  }
}


