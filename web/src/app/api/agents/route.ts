import { NextRequest, NextResponse } from "next/server";
import { getAgents, addAgent, updateAgent } from "@/lib/agents-storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get('includeHidden') === 'true';
  const agents = await getAgents(includeHidden);
  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agent = {
      id: body.agentId,
      name: body.name,
      serverIp: body.serverIp || body.ip,
      location: body.location,
      status: "installing" as const,
      lastSeen: new Date().toISOString(),
    };

    await addAgent(agent);

    // TODO: Actually install agent on server via SSH or API
    // For now, simulate installation
    setTimeout(async () => {
      await updateAgent(agent.id, { status: "online" });
    }, 3000);

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create agent" },
      { status: 500 }
    );
  }
}

