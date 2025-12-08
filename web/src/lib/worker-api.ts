/**
 * Helper functions for communicating with worker agents
 */

import { getAgents, Agent } from "./agents-storage";

interface WorkerRequest {
  taskId: string;
  checkType: string;
  host: string;
  options?: any;
}

/**
 * Call a specific worker agent by URL
 */
export async function callWorkerByUrl(
  workerApiUrl: string,
  checkType: string,
  host: string,
  options: any = {}
): Promise<any> {
  const workerApiKey = process.env.WORKER_API_KEY;

  const taskId = `${checkType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add API key if configured
  if (workerApiKey) {
    headers["X-API-Key"] = workerApiKey;
  }

  const response = await fetch(`${workerApiUrl}/task/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      taskId,
      checkType,
      host,
      options,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Worker API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Call a single worker (backward compatibility)
 * Uses WORKER_API_URL from environment or localhost:8000
 */
export async function callWorker(
  checkType: string,
  host: string,
  options: any = {}
): Promise<any> {
  const workerApiUrl = process.env.WORKER_API_URL || "http://localhost:8000";
  return callWorkerByUrl(workerApiUrl, checkType, host, options);
}

/**
 * Call all online agents in parallel and return aggregated results
 */
export async function callAllAgents(
  checkType: string,
  host: string,
  options: any = {}
): Promise<any[]> {
  const agents = await getAgents();
  const onlineAgents = agents.filter(
    (agent) => agent.status === "online" && agent.serverIp
  );

  if (onlineAgents.length === 0) {
    // Fallback to default worker if no agents are available
    const workerApiUrl = process.env.WORKER_API_URL || "http://localhost:8000";
    try {
      const result = await callWorkerByUrl(workerApiUrl, checkType, host, options);
      // Wrap result in the same structure as agent results for consistency
      return [{
        success: true,
        agent: {
          id: 'fallback',
          name: 'Local Worker',
          serverIp: 'localhost',
          location: 'internal',
          agentLocation: 'Local',
          agentCountryCode: '',
          agentCountry: '',
          agentCity: '',
        },
        result,
      }];
    } catch (error) {
      throw new Error(
        "No online agents available and fallback worker is not accessible"
      );
    }
  }

  // Call all agents in parallel
  const promises = onlineAgents.map(async (agent) => {
    const port = agent.port || 8000;
    const agentUrl = `http://${agent.serverIp}:${port}`;

    try {
      const result = await callWorkerByUrl(agentUrl, checkType, host, options);
      return {
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          serverIp: agent.serverIp,
          location: agent.location,
          agentLocation: agent.agentLocation,
          agentCountryCode: agent.agentCountryCode,
          agentCountry: agent.agentCountry,
          agentCity: agent.agentCity,
          countryEmoji: agent.countryEmoji,
        },
        result,
      };
    } catch (error: any) {
      return {
        success: false,
        agent: {
          id: agent.id,
          name: agent.name,
          serverIp: agent.serverIp,
          location: agent.location,
        },
        error: error.message || "Failed to execute task",
      };
    }
  });

  const results = await Promise.all(promises);
  
  // If all agents failed, try fallback to local worker
  const successfulResults = results.filter(r => r.success === true);
  if (successfulResults.length === 0) {
    const workerApiUrl = process.env.WORKER_API_URL || "http://localhost:8000";
    try {
      const fallbackResult = await callWorkerByUrl(workerApiUrl, checkType, host, options);
      return [{
        success: true,
        agent: {
          id: 'fallback',
          name: 'Local Worker',
          serverIp: 'localhost',
          location: 'internal',
          agentLocation: 'Local',
          agentCountryCode: '',
          agentCountry: '',
          agentCity: '',
        },
        result: fallbackResult,
      }];
    } catch (error) {
      // If fallback also fails, return the failed results
      return results;
    }
  }
  
  return results;
}

