# Check Host - Network Monitoring & Diagnostics

A beautiful, modern web application for network monitoring and diagnostics, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🌐 **IP Information** - Get geolocation data, ISP info, timezone, and more
- 📡 **Ping Test** - Test host reachability and measure latency from global servers
- 🌍 **HTTP Check** - Check website response performance from multiple locations
- 🔍 **DNS Lookup** - Retrieve DNS records (A, AAAA, PTR, MX, TXT, etc.)
- 🔌 **TCP Port Check** - Test TCP port connectivity
- 📡 **UDP Port Check** - Test UDP port communication
- ⚙️ **Agent Dashboard** - Manage and monitor network monitoring agents

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI**: Modern, responsive design with dark mode support

## Getting Started

### Prerequisites

- Node.js 20.9 or higher
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

```env
# Worker API Configuration
WORKER_API_URL=http://localhost:8000
WORKER_API_KEY=your-secret-key-here  # Optional - must match API_KEY in worker

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: If you set `API_KEY` in the worker's `.env` file, you must set the same value in `WORKER_API_KEY` here for authentication to work.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Agent dashboard
│   │   ├── ip-info/      # IP Info page
│   │   ├── ping/         # Ping test page
│   │   ├── http/         # HTTP check page
│   │   ├── dns/          # DNS lookup page
│   │   ├── tcp/          # TCP port check page
│   │   ├── udp/          # UDP port check page
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   └── components/
│       ├── Navigation.tsx    # Navigation component
│       ├── CheckForm.tsx    # Form component for checks
│       └── ResultDisplay.tsx # Results display component
├── public/               # Static assets
└── package.json
```

## API Routes

The application includes API routes that communicate with the worker service:

- `/api/ip-info` - Get IP information
- `/api/ping` - Ping a host
- `/api/http` - Check HTTP response
- `/api/dns` - DNS lookup
- `/api/tcp` - TCP port check
- `/api/udp` - UDP port check
- `/api/agents` - Agent management
- `/api/agents/deploy` - Deploy new agent to remote server

All API routes use the `callWorker` helper function which automatically includes the `X-API-Key` header if `WORKER_API_KEY` is configured.

## Agent Dashboard

The dashboard allows you to:

- Install new agents on remote servers
- View installed agents and their status
- Uninstall agents
- Monitor agent health

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
