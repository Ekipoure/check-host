import { NextRequest, NextResponse } from "next/server";
import { addAgent, updateAgent, addDeploymentLog } from "@/lib/agents-storage";
import { NodeSSH } from "node-ssh";

interface DeploymentConfig {
  serverIp: string;
  username: string;
  password: string;
  targetPath?: string;
  deploymentMethod: "github" | "upload";
  repositoryUrl?: string;
  finalEnvVars: string;
  port?: string;
}

async function deployAgentAsync(
  agentId: string,
  config: DeploymentConfig
): Promise<void> {
  const ssh = new NodeSSH();
  
  try {
    await addDeploymentLog(agentId, `Connecting to ${config.serverIp}...`, "info");
    console.log(`[${agentId}] Connecting to ${config.serverIp}...`);
    
    // Connect to server via SSH
    await ssh.connect({
      host: config.serverIp,
      username: config.username,
      password: config.password,
      readyTimeout: 30000, // 30 seconds timeout
    });

    await addDeploymentLog(agentId, "Connected successfully", "success");
    console.log(`[${agentId}] Connected successfully`);

    // Check prerequisites
    await addDeploymentLog(agentId, "Checking prerequisites (git, node, npm)...", "info");
    console.log(`[${agentId}] Checking prerequisites...`);
    const gitCheck = await ssh.execCommand("which git");
    const npmCheck = await ssh.execCommand("which npm");
    const nodeCheck = await ssh.execCommand("which node");
    
    if (gitCheck.code !== 0) {
      await addDeploymentLog(agentId, "Error: Git is not installed on the server", "error");
      throw new Error("Git is not installed on the server. Please install git first.");
    }
    if (npmCheck.code !== 0 || nodeCheck.code !== 0) {
      await addDeploymentLog(agentId, "Error: Node.js or npm is not installed on the server", "error");
      throw new Error("Node.js or npm is not installed on the server. Please install Node.js first.");
    }
    await addDeploymentLog(agentId, "Prerequisites check passed", "success");
    console.log(`[${agentId}] Prerequisites check passed`);

    // Determine target directory
    // Expand ~ to home directory
    const homeResult = await ssh.execCommand("echo $HOME");
    const homeDir = homeResult.stdout.trim();
    const baseDir = config.targetPath 
      ? config.targetPath.replace(/^~/, homeDir)
      : `${homeDir}/agent-${agentId}`;
    const workerDir = `${baseDir}/worker`;

    // Step 1: Clone repository or handle upload
    if (config.deploymentMethod === "github") {
      if (!config.repositoryUrl) {
        throw new Error("Repository URL is required for GitHub deployment");
      }

      await addDeploymentLog(agentId, `Cloning repository: ${config.repositoryUrl}...`, "info");
      console.log(`[${agentId}] Cloning repository ${config.repositoryUrl}...`);
      
      // Remove existing directory if it exists
      const escapedBaseDir = baseDir.replace(/'/g, "'\\''");
      const removeResult = await ssh.execCommand(`rm -rf '${escapedBaseDir}'`);
      if (removeResult.code !== 0 && removeResult.code !== null) {
        await addDeploymentLog(agentId, `Warning: Could not remove existing directory`, "warning");
        console.warn(`[${agentId}] Warning: Could not remove existing directory: ${removeResult.stderr}`);
      }

      // Clone repository (escape the URL to handle special characters)
      const escapedRepoUrl = config.repositoryUrl.replace(/'/g, "'\\''");
      const cloneResult = await ssh.execCommand(
        `git clone '${escapedRepoUrl}' '${escapedBaseDir}'`,
        { cwd: homeDir }
      );

      if (cloneResult.code !== 0) {
        await addDeploymentLog(agentId, `Failed to clone repository: ${cloneResult.stderr}`, "error");
        throw new Error(`Failed to clone repository: ${cloneResult.stderr}`);
      }

      await addDeploymentLog(agentId, "Repository cloned successfully", "success");
      console.log(`[${agentId}] Repository cloned successfully`);
    } else {
      throw new Error("ZIP upload method is not yet implemented");
    }

    // Step 2: Check if worker directory exists
    console.log(`[${agentId}] Checking worker directory...`);
    const escapedWorkerDir = workerDir.replace(/'/g, "'\\''");
    const checkWorkerResult = await ssh.execCommand(`test -d '${escapedWorkerDir}' && echo "exists" || echo "not exists"`);
    const actualWorkerDir = checkWorkerResult.stdout.trim() === "exists" ? workerDir : baseDir;
    console.log(`[${agentId}] Using directory: ${actualWorkerDir}`);

    // Step 3: Fix package.json and code issues
    await addDeploymentLog(agentId, "Fixing package.json and code issues...", "info");
    
    // Fix package.json - update ipaddress version
    const fixPackageScript = `
      if [ -f package.json ]; then
        sed -i.bak 's/"ipaddress": "\\^1\\.0\\.23"/"ipaddress": "^0.2.6"/g' package.json
        echo "Package.json updated"
      fi
    `;
    
    // Fix code issues - IPv4 to Ipv4, isIP import, etc.
    const fixCodeScript = `
      set -e
      
      # Fix IPv4 to Ipv4 in subnet-calculator.service.ts
      if [ -f src/services/subnet-calculator.service.ts ]; then
        sed -i.bak 's/ipaddress\\.IPv4/ipaddress.Ipv4/g' src/services/subnet-calculator.service.ts
        sed -i.bak 's/ipaddress\\.IPv6/ipaddress.Ipv6/g' src/services/subnet-calculator.service.ts
      fi
      
      # Fix IPv4 to Ipv4 and isIP import in helpers.ts
      if [ -f src/utils/helpers.ts ]; then
        sed -i.bak 's/ipaddress\\.IPv4/ipaddress.Ipv4/g' src/utils/helpers.ts
        sed -i.bak 's/ipaddress\\.IPv6/ipaddress.Ipv6/g' src/utils/helpers.ts
        # Fix isIP import - change from dns to net
        sed -i.bak "s/import { isIP } from 'dns'/import { isIP } from 'net'/g" src/utils/helpers.ts
      fi
      
      # Fix port type in index.ts - ensure PORT is number
      if [ -f src/index.ts ]; then
        # Replace app.listen(PORT, HOST with app.listen(Number(PORT), HOST
        sed -i.bak 's/app\\.listen(PORT,/app.listen(Number(PORT),/g' src/index.ts
        sed -i.bak 's/app\\.listen(process\\.env\\.PORT/app.listen(Number(process.env.PORT)/g' src/index.ts
      fi
      
      # Fix port-check.service.ts
      if [ -f src/services/port-check.service.ts ]; then
        # Comment out setTimeout line (UDP sockets don't have setTimeout)
        sed -i.bak 's/socket\\.setTimeout(1000);/\/\/ socket.setTimeout(1000); \/\/ Removed: UDP sockets don't support setTimeout/g' src/services/port-check.service.ts
        sed -i.bak 's/socket.setTimeout(1000);/\/\/ socket.setTimeout(1000); \/\/ Removed: UDP sockets don't support setTimeout/g' src/services/port-check.service.ts
        # Remove note property from return object (not in TCPResult type)
        sed -i.bak "s/note: 'No response received',//g" src/services/port-check.service.ts
        sed -i.bak 's/note: "No response received",//g' src/services/port-check.service.ts
      fi
      
      echo "Code fixes applied successfully"
    `;
    
    const fixPackageResult = await ssh.execCommand(fixPackageScript, {
      cwd: actualWorkerDir,
    });
    
    const fixCodeResult = await ssh.execCommand(fixCodeScript, {
      cwd: actualWorkerDir,
    });
    
    // Verify fixes were applied
    const verifyResult = await ssh.execCommand(`
      echo "Verifying fixes..."
      grep -c "ipaddress.Ipv4" src/services/subnet-calculator.service.ts 2>/dev/null || echo "0"
      grep -c "from 'net'" src/utils/helpers.ts 2>/dev/null || echo "0"
      grep -c "Number(PORT)" src/index.ts 2>/dev/null || echo "0"
    `, { cwd: actualWorkerDir });
    
    if (fixPackageResult.code === 0 && fixCodeResult.code === 0) {
      await addDeploymentLog(agentId, "Package.json and code fixes applied successfully", "success");
      console.log(`[${agentId}] Fix verification: ${verifyResult.stdout}`);
    } else {
      await addDeploymentLog(agentId, `Warning: Some fixes may have failed. Package: ${fixPackageResult.code}, Code: ${fixCodeResult.code}`, "warning");
      console.log(`[${agentId}] Fix results - Package: ${fixPackageResult.stdout}, Code: ${fixCodeResult.stdout}`);
    }

    // Step 4: Install dependencies
    await addDeploymentLog(agentId, "Installing dependencies (npm install)...", "info");
    console.log(`[${agentId}] Installing dependencies...`);
    const installResult = await ssh.execCommand("npm install", {
      cwd: actualWorkerDir,
    });

    if (installResult.code !== 0) {
      await addDeploymentLog(agentId, `Failed to install dependencies: ${installResult.stderr}`, "error");
      throw new Error(`Failed to install dependencies: ${installResult.stderr}`);
    }

    await addDeploymentLog(agentId, "Dependencies installed successfully", "success");
    console.log(`[${agentId}] Dependencies installed successfully`);

    // Step 4.5: Ensure native-dns is installed (required for DNS TTL support)
    await addDeploymentLog(agentId, "Ensuring native-dns package is installed...", "info");
    console.log(`[${agentId}] Installing native-dns...`);
    const nativeDnsInstallResult = await ssh.execCommand("npm install native-dns", {
      cwd: actualWorkerDir,
    });

    if (nativeDnsInstallResult.code !== 0) {
      await addDeploymentLog(agentId, `Warning: native-dns installation had issues: ${nativeDnsInstallResult.stderr}`, "warning");
      console.warn(`[${agentId}] native-dns install warning: ${nativeDnsInstallResult.stderr}`);
    } else {
      await addDeploymentLog(agentId, "native-dns package installed successfully", "success");
      console.log(`[${agentId}] native-dns installed successfully`);
    }

    // Step 5: Create .env file
    if (config.finalEnvVars) {
      await addDeploymentLog(agentId, "Creating .env file...", "info");
      console.log(`[${agentId}] Creating .env file...`);
      
      // Use base64 encoding to safely transfer .env content
      // This avoids issues with special characters
      const base64EnvVars = Buffer.from(config.finalEnvVars).toString('base64');
      
      // Decode and write to .env file on remote server
      const createEnvResult = await ssh.execCommand(
        `echo '${base64EnvVars}' | base64 -d > .env`,
        { cwd: actualWorkerDir }
      );

      if (createEnvResult.code !== 0) {
        // Fallback to heredoc method if base64 is not available
        console.warn(`[${agentId}] Base64 method failed, trying heredoc method...`);
        const escapedEnvVars = config.finalEnvVars
          .replace(/\\/g, "\\\\")
          .replace(/\$/g, "\\$")
          .replace(/`/g, "\\`")
          .replace(/'/g, "'\\''");
        
        const fallbackResult = await ssh.execCommand(
          `cat > .env << 'ENVEOF'\n${escapedEnvVars}\nENVEOF`,
          { cwd: actualWorkerDir }
        );

        if (fallbackResult.code !== 0) {
          throw new Error(`Failed to create .env file: ${fallbackResult.stderr}`);
        }
      }

      await addDeploymentLog(agentId, ".env file created successfully", "success");
      console.log(`[${agentId}] .env file created successfully`);
      
      // Verify .env file was created and contains AGENT_ID
      const verifyEnvResult = await ssh.execCommand("cat .env | grep AGENT_ID || echo 'AGENT_ID not found'", {
        cwd: actualWorkerDir,
      });
      
      if (verifyEnvResult.stdout.includes('AGENT_ID not found')) {
        await addDeploymentLog(agentId, "Warning: AGENT_ID not found in .env file, recreating...", "warning");
        // Recreate .env file with proper content
        const base64EnvVars = Buffer.from(config.finalEnvVars).toString('base64');
        await ssh.execCommand(
          `echo '${base64EnvVars}' | base64 -d > .env && chmod 644 .env`,
          { cwd: actualWorkerDir }
        );
        // Verify again
        const recheckEnvResult = await ssh.execCommand("cat .env | grep AGENT_ID || echo 'still not found'", {
          cwd: actualWorkerDir,
        });
        if (recheckEnvResult.stdout.includes('still not found')) {
          await addDeploymentLog(agentId, `Error: Failed to create .env with AGENT_ID. Content: ${recheckEnvResult.stdout}`, "error");
        } else {
          await addDeploymentLog(agentId, "✅ .env file verified and contains AGENT_ID", "success");
        }
      } else {
        await addDeploymentLog(agentId, "✅ .env file verified and contains AGENT_ID", "success");
      }
    }

    // Step 6: Build the project
    await addDeploymentLog(agentId, "Building project (npm run build)...", "info");
    console.log(`[${agentId}] Building project...`);
    const buildResult = await ssh.execCommand("npm run build", {
      cwd: actualWorkerDir,
    });

    if (buildResult.code !== 0) {
      const errorMsg = buildResult.stderr || buildResult.stdout || "Unknown build error";
      await addDeploymentLog(agentId, `Failed to build project: ${errorMsg}`, "error");
      console.error(`[${agentId}] Build error - stderr: ${buildResult.stderr}, stdout: ${buildResult.stdout}`);
      throw new Error(`Failed to build project: ${errorMsg}`);
    }
    
    // Log build output for debugging
    if (buildResult.stdout) {
      console.log(`[${agentId}] Build output: ${buildResult.stdout.substring(0, 200)}`);
    }

    await addDeploymentLog(agentId, "Project built successfully", "success");
    console.log(`[${agentId}] Project built successfully`);

    // Step 6.5: Check if agent is already running
    await addDeploymentLog(agentId, "Checking if agent is already running...", "info");
    const pm2StatusCheck = await ssh.execCommand("pm2 list --no-color | grep check-host-worker || echo 'not running'", {
      cwd: actualWorkerDir,
    });
    
    const isAgentRunning = pm2StatusCheck.stdout.includes("check-host-worker") && 
                          !pm2StatusCheck.stdout.includes("not running") &&
                          (pm2StatusCheck.stdout.includes("online") || pm2StatusCheck.stdout.includes("│ online"));

    // Step 7: Ensure PM2 is installed globally
    await addDeploymentLog(agentId, "Checking PM2 installation...", "info");
    const pm2CheckResult = await ssh.execCommand("pm2 --version || echo 'not installed'");
    if (pm2CheckResult.stdout.includes("not installed")) {
      await addDeploymentLog(agentId, "Installing PM2 globally...", "info");
      const pm2InstallResult = await ssh.execCommand("npm install -g pm2", {
        cwd: actualWorkerDir,
      });
      if (pm2InstallResult.code !== 0) {
        await addDeploymentLog(agentId, `Warning: PM2 installation had issues: ${pm2InstallResult.stderr}`, "warning");
      } else {
        await addDeploymentLog(agentId, "PM2 installed successfully", "success");
      }
    } else {
      await addDeploymentLog(agentId, `PM2 is installed (version: ${pm2CheckResult.stdout.trim()})`, "success");
    }

    // Step 8: Install and start with PM2 (or restart if already running)
    if (isAgentRunning) {
      // Agent is already running, just restart it to load new code
      await addDeploymentLog(agentId, "Restarting existing agent to load new code...", "info");
      console.log(`[${agentId}] Restarting existing agent...`);
      
      const restartResult = await ssh.execCommand("pm2 restart check-host-worker", {
        cwd: actualWorkerDir,
      });
      
      if (restartResult.code !== 0) {
        const errorMsg = restartResult.stderr || restartResult.stdout || "Unknown error";
        await addDeploymentLog(agentId, `Failed to restart agent: ${errorMsg}`, "error");
        console.error(`[${agentId}] PM2 restart error - stderr: ${restartResult.stderr}, stdout: ${restartResult.stdout}`);
        throw new Error(`Failed to restart agent: ${errorMsg}`);
      }
      
      await addDeploymentLog(agentId, "Agent restarted successfully", "success");
      console.log(`[${agentId}] Agent restarted successfully`);
      // Wait a bit for the restart to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // Agent is not running, install and start it
      await addDeploymentLog(agentId, "Installing and starting agent with PM2...", "info");
      console.log(`[${agentId}] Installing and starting agent with PM2...`);
      
      // Stop existing process if any (in case it's stopped but not deleted)
      await ssh.execCommand("pm2 stop check-host-worker || true", { cwd: actualWorkerDir });
      await ssh.execCommand("pm2 delete check-host-worker || true", { cwd: actualWorkerDir });
      
      const installAgentResult = await ssh.execCommand("npm run agent:install", {
        cwd: actualWorkerDir,
      });

      if (installAgentResult.code !== 0) {
        const errorMsg = installAgentResult.stderr || installAgentResult.stdout || "Unknown error";
        await addDeploymentLog(agentId, `Failed to install agent: ${errorMsg}`, "error");
        console.error(`[${agentId}] PM2 install error - stderr: ${installAgentResult.stderr}, stdout: ${installAgentResult.stdout}`);
        throw new Error(`Failed to install agent: ${errorMsg}`);
      }

      await addDeploymentLog(agentId, "PM2 installation command completed", "info");
      console.log(`[${agentId}] PM2 install output: ${installAgentResult.stdout.substring(0, 500)}`);
    }

    // Step 9: Verify PM2 process is running
    await addDeploymentLog(agentId, "Verifying PM2 process status...", "info");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for PM2 to start
    
    const pm2ListResult = await ssh.execCommand("pm2 list --no-color", { cwd: actualWorkerDir });
    console.log(`[${agentId}] PM2 list: ${pm2ListResult.stdout}`);
    
    const pm2InfoResult = await ssh.execCommand("pm2 info check-host-worker --no-color 2>&1 || echo 'not found'", {
      cwd: actualWorkerDir,
    });
    console.log(`[${agentId}] PM2 info: ${pm2InfoResult.stdout.substring(0, 500)}`);

    // Check if process exists and is online
    if (pm2ListResult.stdout.includes("check-host-worker") && 
        (pm2ListResult.stdout.includes("online") || pm2ListResult.stdout.includes("│ online"))) {
      await addDeploymentLog(agentId, "✅ Agent is running with PM2 (status: online)", "success");
      
      // Step 10: Health check
      await addDeploymentLog(agentId, "Performing health check...", "info");
      const port = config.port || "8000";
      const healthCheckResult = await ssh.execCommand(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health || echo "failed"`,
        { cwd: actualWorkerDir }
      );
      
      if (healthCheckResult.stdout.includes("200") || healthCheckResult.stdout.includes("OK")) {
        await addDeploymentLog(agentId, "✅ Health check passed - Agent is responding", "success");
        await updateAgent(agentId, { 
          status: "online", 
          lastSeen: new Date().toISOString(),
          deploymentPath: actualWorkerDir,
          port: parseInt(port),
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDeploymentLog(agentId, `⚠️ Health check returned: ${healthCheckResult.stdout}`, "warning");
        await updateAgent(agentId, { 
          status: "online", 
          lastSeen: new Date().toISOString(),
          deploymentPath: actualWorkerDir,
          port: parseInt(port),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      await addDeploymentLog(agentId, `⚠️ PM2 process status unclear. Output: ${pm2ListResult.stdout.substring(0, 200)}`, "warning");
      await updateAgent(agentId, { 
        status: "offline", 
        lastSeen: new Date().toISOString(),
        deploymentPath: actualWorkerDir,
        updatedAt: new Date().toISOString(),
      });
    }

    ssh.dispose();
  } catch (error: any) {
    await addDeploymentLog(agentId, `❌ Deployment failed: ${error.message}`, "error");
    console.error(`[${agentId}] Deployment error:`, error);
    try {
      ssh.dispose();
    } catch (disposeError) {
      // Ignore dispose errors
    }
    await updateAgent(agentId, { status: "offline" });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      serverIp,
      serverLocation,
      username,
      password,
      targetPath,
      deploymentMethod,
      repositoryUrl,
      // Agent Configuration
      agentLocation,
      agentCountryCode,
      agentCountry,
      agentCity,
      agentIp,
      agentAsn,
      countryEmoji,
      // Network Configuration
      port,
      host,
      // Security
      apiKey,
      // API Keys
      ipapiKey,
      ipgeolocationApiKey,
      ipinfoApiKey,
      // Other
      nodeEnv,
      // Advanced
      envVars,
    } = body;

    // Validate required fields
    if (!name || !serverIp || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (deploymentMethod === "github" && !repositoryUrl) {
      return NextResponse.json(
        { success: false, error: "Repository URL is required for GitHub deployment" },
        { status: 400 }
      );
    }

    // Generate unique agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build environment variables from form fields
    const envVarsArray: string[] = [];
    
    // Auto-generated (always added)
    envVarsArray.push(`AGENT_ID=${agentId}`);
    envVarsArray.push(`AGENT_NAME=${name}`);
    
    // Agent Configuration
    if (agentLocation) envVarsArray.push(`AGENT_LOCATION=${agentLocation}`);
    if (agentCountryCode) envVarsArray.push(`AGENT_COUNTRY_CODE=${agentCountryCode}`);
    if (agentCountry) envVarsArray.push(`AGENT_COUNTRY=${agentCountry}`);
    if (agentCity) envVarsArray.push(`AGENT_CITY=${agentCity}`);
    if (agentIp) envVarsArray.push(`AGENT_IP=${agentIp}`);
    if (agentAsn) envVarsArray.push(`AGENT_ASN=${agentAsn}`);
    
    // Network Configuration
    if (port) envVarsArray.push(`PORT=${port}`);
    if (host) envVarsArray.push(`HOST=${host}`);
    
    // Security
    if (apiKey) envVarsArray.push(`API_KEY=${apiKey}`);
    
    // API Keys
    if (ipapiKey) envVarsArray.push(`IPAPI_KEY=${ipapiKey}`);
    if (ipgeolocationApiKey) envVarsArray.push(`IPGEOLOCATION_API_KEY=${ipgeolocationApiKey}`);
    if (ipinfoApiKey) envVarsArray.push(`IPINFO_API_KEY=${ipinfoApiKey}`);
    
    // Other
    if (nodeEnv) envVarsArray.push(`NODE_ENV=${nodeEnv}`);
    
    // Parse additional environment variables from textarea
    let additionalEnvVars = envVars || "";
    
    // Remove variables that we're setting from form fields to avoid duplicates
    const formFieldVars = [
      'AGENT_ID', 'AGENT_NAME', 'AGENT_LOCATION', 'AGENT_COUNTRY_CODE',
      'AGENT_COUNTRY', 'AGENT_CITY', 'AGENT_IP', 'AGENT_ASN',
      'PORT', 'HOST', 'API_KEY', 'IPAPI_KEY', 'IPGEOLOCATION_API_KEY',
      'IPINFO_API_KEY', 'NODE_ENV'
    ];
    
    if (additionalEnvVars) {
      const additionalLines = additionalEnvVars
        .split('\n')
        .filter((line: string) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return false;
          const key = trimmed.split('=')[0].trim();
          return !formFieldVars.includes(key);
        });
      
      if (additionalLines.length > 0) {
        envVarsArray.push(...additionalLines);
      }
    }
    
    // Combine all environment variables
    const finalEnvVars = envVarsArray.join('\n');

    // Create agent record (password is NOT stored in database)
    const agent = {
      id: agentId,
      name,
      serverIp,
      location: serverLocation || "internal",
      status: "installing" as const,
      lastSeen: new Date().toISOString(),
      username,
      targetPath,
      deploymentMethod,
      repositoryUrl,
      port: port ? parseInt(port) : 8000,
      host: host || '0.0.0.0',
      agentLocation,
      agentCountryCode,
      agentCountry,
      agentCity,
      agentIp,
      agentAsn,
      countryEmoji,
    };

    await addAgent(agent);

    // Start deployment asynchronously (don't wait for it to complete)
    deployAgentAsync(agentId, {
      serverIp,
      username,
      password, // Password is only used during deployment, not stored
      targetPath,
      deploymentMethod,
      repositoryUrl,
      finalEnvVars,
    }).catch(async (error) => {
      console.error(`Deployment failed for agent ${agentId}:`, error);
      await updateAgent(agentId, { status: "offline" });
    });

    return NextResponse.json({
      success: true,
      agent,
      message: "Agent deployment started. This may take a few minutes.",
    });
  } catch (error: any) {
    console.error("Error deploying agent:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to deploy agent" },
      { status: 500 }
    );
  }
}

