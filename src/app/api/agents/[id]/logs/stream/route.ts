import { NextRequest } from "next/server";
import { getDeploymentLogs } from "@/lib/agents-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastLogCount = 0;
      
      const sendLogs = async () => {
        try {
          const logs = await getDeploymentLogs(id);
          
          if (logs.length > lastLogCount) {
            const newLogs = logs.slice(lastLogCount);
            for (const log of newLogs) {
              const data = `data: ${JSON.stringify(log)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            lastLogCount = logs.length;
          }
        } catch (error) {
          console.error("Error sending logs:", error);
        }
      };
      
      // Send initial logs
      sendLogs();
      
      // Poll for new logs every 500ms
      const interval = setInterval(() => {
        sendLogs().catch(console.error);
      }, 500);
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


