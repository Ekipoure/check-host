/**
 * PostgreSQL Database Connection and Schema
 */

import { Pool } from 'pg';

// Create connection pool
function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    // Parse the connection string to extract components
    const url = new URL(databaseUrl);
    
    // Ensure password is a string (decode if needed)
    const password = url.password || '';
    
    // Build config object
    const poolConfig: any = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1) || 'neondb', // Remove leading '/'
      user: url.username || 'neondb_owner',
      password: password, // Ensure it's a string
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    // Configure SSL
    const sslMode = url.searchParams.get('sslmode');
    if (sslMode === 'require' || sslMode === 'prefer') {
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    }

    // Handle error events
    const pool = new Pool(poolConfig);
    
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });

    return pool;
  } catch (error) {
    // Fallback: use connection string directly
    console.warn('⚠️ Failed to parse DATABASE_URL, using connection string directly:', error);
    const poolConfig: any = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    if (databaseUrl.includes('sslmode=require')) {
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    }

    return new Pool(poolConfig);
  }
}

// Create connection pool
const pool = createPool();

// Initialize database schema
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create agents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        server_ip VARCHAR(255) NOT NULL,
        location VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'offline',
        last_seen TIMESTAMP,
        port INTEGER DEFAULT 8000,
        host VARCHAR(255) DEFAULT '0.0.0.0',
        agent_location VARCHAR(255),
        agent_country_code VARCHAR(10),
        agent_country VARCHAR(255),
        agent_city VARCHAR(255),
        agent_ip VARCHAR(255),
        agent_asn VARCHAR(255),
        deployment_path TEXT,
        username VARCHAR(255),
        target_path TEXT,
        deployment_method VARCHAR(50),
        repository_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deployment_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deployment_logs_agent_id ON deployment_logs(agent_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deployment_logs_timestamp ON deployment_logs(timestamp DESC)
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Initialize on module load (only in server-side)
if (typeof window === 'undefined') {
  initializeDatabase().catch(console.error);
}

export { pool };

