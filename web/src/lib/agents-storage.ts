/**
 * Database storage for agents using PostgreSQL
 */

import { pool } from './database';

export interface Agent {
  id: string;
  name: string;
  serverIp: string;
  location?: "internal" | "external";
  status: "online" | "offline" | "installing" | "disabled";
  lastSeen?: string;
  port?: number;
  host?: string;
  agentLocation?: string;
  agentCountryCode?: string;
  agentCountry?: string;
  agentCity?: string;
  agentIp?: string;
  agentAsn?: string;
  countryEmoji?: string;
  deploymentPath?: string;
  createdAt?: string;
  updatedAt?: string;
  hidden?: boolean;
  // Additional fields for deployment
  username?: string;
  targetPath?: string;
  deploymentMethod?: "github" | "upload";
  repositoryUrl?: string;
}

export interface DeploymentLog {
  agentId: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

// Helper function to map database row to Agent
function mapRowToAgent(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    serverIp: row.server_ip,
    location: row.location,
    status: row.status,
    lastSeen: row.last_seen ? new Date(row.last_seen).toISOString() : undefined,
    port: row.port,
    host: row.host,
    agentLocation: row.agent_location,
    agentCountryCode: row.agent_country_code,
    agentCountry: row.agent_country,
    agentCity: row.agent_city,
    agentIp: row.agent_ip,
    agentAsn: row.agent_asn,
    countryEmoji: row.country_emoji,
    deploymentPath: row.deployment_path,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    hidden: row.hidden || false,
    username: row.username,
    targetPath: row.target_path,
    deploymentMethod: row.deployment_method,
    repositoryUrl: row.repository_url,
  };
}

// Helper function to map database row to DeploymentLog
function mapRowToLog(row: any): DeploymentLog {
  return {
    agentId: row.agent_id,
    timestamp: new Date(row.timestamp).toISOString(),
    message: row.message,
    type: row.type,
  };
}

export async function getAgents(includeHidden: boolean = false): Promise<Agent[]> {
  const client = await pool.connect();
  try {
    const query = includeHidden 
      ? 'SELECT * FROM agents ORDER BY created_at DESC'
      : 'SELECT * FROM agents WHERE hidden = false OR hidden IS NULL ORDER BY created_at DESC';
    const result = await client.query(query);
    return result.rows.map(mapRowToAgent);
  } finally {
    client.release();
  }
}

export async function getAgentById(agentId: string): Promise<Agent | null> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM agents WHERE id = $1', [agentId]);
    if (result.rows.length === 0) {
      return null;
    }
    return mapRowToAgent(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function addAgent(agent: Agent): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO agents (
        id, name, server_ip, location, status, last_seen, port, host,
        agent_location, agent_country_code, agent_country, agent_city,
        agent_ip, agent_asn, country_emoji, deployment_path, username, target_path,
        deployment_method, repository_url, hidden, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, [
      agent.id,
      agent.name,
      agent.serverIp,
      agent.location || null,
      agent.status,
      agent.lastSeen ? new Date(agent.lastSeen) : null,
      agent.port || 8000,
      agent.host || '0.0.0.0',
      agent.agentLocation || null,
      agent.agentCountryCode || null,
      agent.agentCountry || null,
      agent.agentCity || null,
      agent.agentIp || null,
      agent.agentAsn || null,
      agent.countryEmoji || null,
      agent.deploymentPath || null,
      agent.username || null,
      agent.targetPath || null,
      agent.deploymentMethod || null,
      agent.repositoryUrl || null,
      agent.hidden || false,
    ]);
  } finally {
    client.release();
  }
}

export async function removeAgent(agentId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM agents WHERE id = $1', [agentId]);
  } finally {
    client.release();
  }
}

export async function updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
  const client = await pool.connect();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.serverIp !== undefined) {
      fields.push(`server_ip = $${paramIndex++}`);
      values.push(updates.serverIp);
    }
    if (updates.location !== undefined) {
      fields.push(`location = $${paramIndex++}`);
      values.push(updates.location);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.lastSeen !== undefined) {
      fields.push(`last_seen = $${paramIndex++}`);
      values.push(updates.lastSeen ? new Date(updates.lastSeen) : null);
    }
    if (updates.port !== undefined) {
      fields.push(`port = $${paramIndex++}`);
      values.push(updates.port);
    }
    if (updates.host !== undefined) {
      fields.push(`host = $${paramIndex++}`);
      values.push(updates.host);
    }
    if (updates.agentLocation !== undefined) {
      fields.push(`agent_location = $${paramIndex++}`);
      values.push(updates.agentLocation);
    }
    if (updates.agentCountryCode !== undefined) {
      fields.push(`agent_country_code = $${paramIndex++}`);
      values.push(updates.agentCountryCode);
    }
    if (updates.agentCountry !== undefined) {
      fields.push(`agent_country = $${paramIndex++}`);
      values.push(updates.agentCountry);
    }
    if (updates.agentCity !== undefined) {
      fields.push(`agent_city = $${paramIndex++}`);
      values.push(updates.agentCity);
    }
    if (updates.agentIp !== undefined) {
      fields.push(`agent_ip = $${paramIndex++}`);
      values.push(updates.agentIp);
    }
    if (updates.agentAsn !== undefined) {
      fields.push(`agent_asn = $${paramIndex++}`);
      values.push(updates.agentAsn);
    }
    if (updates.countryEmoji !== undefined) {
      fields.push(`country_emoji = $${paramIndex++}`);
      values.push(updates.countryEmoji);
    }
    if (updates.deploymentPath !== undefined) {
      fields.push(`deployment_path = $${paramIndex++}`);
      values.push(updates.deploymentPath);
    }
    if (updates.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.targetPath !== undefined) {
      fields.push(`target_path = $${paramIndex++}`);
      values.push(updates.targetPath);
    }
    if (updates.deploymentMethod !== undefined) {
      fields.push(`deployment_method = $${paramIndex++}`);
      values.push(updates.deploymentMethod);
    }
    if (updates.repositoryUrl !== undefined) {
      fields.push(`repository_url = $${paramIndex++}`);
      values.push(updates.repositoryUrl);
    }
    if (updates.hidden !== undefined) {
      fields.push(`hidden = $${paramIndex++}`);
      values.push(updates.hidden);
    }

    if (fields.length === 0) {
      return; // No updates to make
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(agentId);

    await client.query(
      `UPDATE agents SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  } finally {
    client.release();
  }
}

export async function addDeploymentLog(
  agentId: string,
  message: string,
  type: "info" | "success" | "error" | "warning" = "info"
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO deployment_logs (agent_id, message, type) VALUES ($1, $2, $3)',
      [agentId, message, type]
    );
  } finally {
    client.release();
  }
}

export async function getDeploymentLogs(agentId: string): Promise<DeploymentLog[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM deployment_logs WHERE agent_id = $1 ORDER BY timestamp DESC',
      [agentId]
    );
    return result.rows.map(mapRowToLog);
  } finally {
    client.release();
  }
}

export async function clearDeploymentLogs(agentId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM deployment_logs WHERE agent_id = $1', [agentId]);
  } finally {
    client.release();
  }
}

