import { NextRequest, NextResponse } from "next/server";
import { getDeploymentLogs } from "@/lib/agents-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await getDeploymentLogs(id);
    
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get logs" },
      { status: 500 }
    );
  }
}

