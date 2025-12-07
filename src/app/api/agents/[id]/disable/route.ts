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

    // Stop PM2 process via SSH
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: agent.serverIp,
        username: agent.username || 'root',
        password: '', // Password should not be stored in database
        readyTimeout: 10000,
      });

      if (agent.deploymentPath) {
        await ssh.execCommand("pm2 stop check-host-worker", {
          cwd: agent.deploymentPath,
        });
      } else {
        await ssh.execCommand("pm2 stop check-host-worker");
      }

      ssh.dispose();
      await updateAgent(id, { status: "disabled", updatedAt: new Date().toISOString() });

      return NextResponse.json({
        success: true,
        message: "Agent disabled successfully",
      });
    } catch (error: any) {
      ssh.dispose();
      await updateAgent(id, { status: "disabled", updatedAt: new Date().toISOString() });
      return NextResponse.json({
        success: true,
        message: "Agent marked as disabled (PM2 stop may have failed)",
        warning: error.message,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disable agent" },
      { status: 500 }
    );
  }
}


