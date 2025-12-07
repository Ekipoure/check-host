import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgent, removeAgent } from "@/lib/agents-storage";
import { NodeSSH } from "node-ssh";

// GET - Get agent details
export async function GET(
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

    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get agent" },
      { status: 500 }
    );
  }
}

// PUT - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const agent = await getAgentById(id);
    
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // Don't allow updating password through this endpoint
    const { password, ...updateData } = body;
    
    await updateAgent(id, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const updatedAgent = await getAgentById(id);
    return NextResponse.json({
      success: true,
      agent: updatedAgent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE - Delete agent
export async function DELETE(
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

    // TODO: Actually uninstall from server via SSH
    await removeAgent(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete agent" },
      { status: 500 }
    );
  }
}


