import { NextRequest, NextResponse } from "next/server";
import { getAgentById, updateAgent } from "@/lib/agents-storage";
import { NodeSSH } from "node-ssh";

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

    // Check PM2 status via SSH
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: agent.serverIp,
        username: agent.username || 'root',
        password: '', // Password should not be stored in database
        readyTimeout: 10000,
      });

      const pm2StatusResult = await ssh.execCommand("pm2 list --no-color | grep check-host-worker || echo 'not found'");
      const pm2InfoResult = await ssh.execCommand("pm2 info check-host-worker --no-color 2>&1 || echo 'not found'");
      
      const isOnline = pm2StatusResult.stdout.includes("check-host-worker") && 
                      (pm2StatusResult.stdout.includes("online") || pm2StatusResult.stdout.includes("│ online"));
      
      // Health check
      const port = agent.port || 8000;
      const healthResult = await ssh.execCommand(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health || echo "failed"`,
      );
      
      const isHealthy = healthResult.stdout.includes("200") || healthResult.stdout.includes("OK");
      
      const status = isOnline && isHealthy ? "online" : "offline";
      await updateAgent(id, { 
        status, 
        lastSeen: new Date().toISOString() 
      });

      ssh.dispose();

      return NextResponse.json({
        success: true,
        status,
        isOnline,
        isHealthy,
        pm2Status: pm2StatusResult.stdout,
        pm2Info: pm2InfoResult.stdout.substring(0, 500),
      });
    } catch (error: any) {
      ssh.dispose();
      await updateAgent(id, { status: "offline" });
      return NextResponse.json({
        success: false,
        status: "offline",
        error: error.message,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}


