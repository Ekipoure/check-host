/**
 * PostgreSQL Database Connection and Schema
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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
        country_emoji VARCHAR(10),
        deployment_path TEXT,
        username VARCHAR(255),
        target_path TEXT,
        deployment_method VARCHAR(50),
        repository_url TEXT,
        hidden BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add hidden column if it doesn't exist (migration)
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='agents' AND column_name='hidden'
      `);
      
      if (columnCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE agents 
          ADD COLUMN hidden BOOLEAN DEFAULT false
        `);
        console.log('✅ Added hidden column to agents table');
      }
    } catch (error: any) {
      console.warn('Warning adding hidden column:', error.message);
    }

    // Add country_emoji column if it doesn't exist (migration)
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='agents' AND column_name='country_emoji'
      `);
      
      if (columnCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE agents 
          ADD COLUMN country_emoji VARCHAR(10)
        `);
        console.log('✅ Added country_emoji column to agents table');
      }
    } catch (error: any) {
      console.warn('Warning adding country_emoji column:', error.message);
    }

    // Add display_order column to agents table if it doesn't exist (migration)
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='agents' AND column_name='display_order'
      `);
      
      if (columnCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE agents 
          ADD COLUMN display_order INTEGER DEFAULT 0
        `);
        console.log('✅ Added display_order column to agents table');
      }
    } catch (error: any) {
      console.warn('Warning adding display_order column to agents:', error.message);
    }

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

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add display_order column to admins table if it doesn't exist (migration)
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='admins' AND column_name='display_order'
      `);
      
      if (columnCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE admins 
          ADD COLUMN display_order INTEGER DEFAULT 0
        `);
        console.log('✅ Added display_order column to admins table');
      }
    } catch (error: any) {
      console.warn('Warning adding display_order column to admins:', error.message);
    }

    // Create banners table
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        text_color VARCHAR(50) DEFAULT '#000000',
        background_color VARCHAR(50),
        has_background BOOLEAN DEFAULT true,
        font_size INTEGER DEFAULT 16,
        animation_duration INTEGER DEFAULT 20,
        link_url TEXT,
        position VARCHAR(20) DEFAULT 'top',
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add display_order column to banners table if it doesn't exist (migration)
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='banners' AND column_name='display_order'
      `);
      
      if (columnCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE banners 
          ADD COLUMN display_order INTEGER DEFAULT 0
        `);
        console.log('✅ Added display_order column to banners table');
      }
    } catch (error: any) {
      console.warn('Warning adding display_order column to banners:', error.message);
    }

    // Add partial_links column if it doesn't exist (migration)
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='banners' AND column_name='partial_links'
      `);
      
      if (columnCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE banners 
          ADD COLUMN partial_links JSONB
        `);
        console.log('✅ Added partial_links column to banners table');
      }
    } catch (error: any) {
      console.warn('Warning adding partial_links column:', error.message);
    }

    // Create advertisements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'gif')),
        file_url TEXT NOT NULL,
        file_path TEXT,
        link_url TEXT,
        position VARCHAR(20) DEFAULT 'below_table',
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_advertisements_display_order ON advertisements(display_order)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_agents_display_order ON agents(display_order)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_display_order ON admins(display_order)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order)
    `);

    // Create default admin if no admins exist
    const adminCheck = await client.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminCheck.rows[0].count) === 0) {
      // Default admin: username: admin, password: admin123 (should be changed immediately)
      const defaultPasswordHash = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
        ['admin', defaultPasswordHash]
      );
      console.log('⚠️ Default admin created: username=admin, password=admin123');
      console.log('⚠️ Please change the default password immediately!');
    }

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

