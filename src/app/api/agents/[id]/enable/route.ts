import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgent } from "@/lib/agents-storage";
import { NodeSSH } from "node-ssh";

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

    // Start PM2 process via SSH
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: agent.serverIp,
        username: agent.username || 'root',
        password: '', // Password should not be stored in database
        readyTimeout: 10000,
      });

      if (agent.deploymentPath) {
        await ssh.execCommand("pm2 start check-host-worker", {
          cwd: agent.deploymentPath,
        });
      } else {
        await ssh.execCommand("pm2 start check-host-worker");
      }

      ssh.dispose();
      
      // Wait a bit and check status
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateAgent(id, { status: "online", lastSeen: new Date().toISOString(), updatedAt: new Date().toISOString() });

      return NextResponse.json({
        success: true,
        message: "Agent enabled successfully",
      });
    } catch (error: any) {
      ssh.dispose();
      return NextResponse.json({
        success: false,
        error: error.message || "Failed to enable agent",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enable agent" },
      { status: 500 }
    );
  }
}


