# Ultimate Aerospace Real-Time RTOS

A fully functional aerospace RTOS dashboard built with Next.js.

## Features

- **Task Manager** — Live color-coded task grid (42 active tasks, 6 queued)
- **AI Threat Detection** — Real-time radar with hostile/friendly/unknown contacts + sweep animation
- **Module Selection** — Toggle Weather Analysis, Path Prediction, ATC Comms modules
- **System Status** — Live CPU/Memory graphs, uptime counter, sparklines
- **Primary Flight Display (PFD)** — Full canvas-rendered artificial horizon, speed tape, altitude tape, heading bar, roll indicator, flight path marker
- **Engine & Systems** — N1/N2 gauges, animated bar meters, fuel table, EICAS controls
- **AI Vision** — Simulated camera feed with target detection overlays
- **Alert System** — Animated turbulence warning with TCAS/GPWS/WXR status

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: GitHub + Vercel Dashboard
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Framework: **Next.js** (auto-detected)
5. Click Deploy

No environment variables required.

## Tech Stack

- **Next.js 14** — React framework
- **Canvas API** — PFD rendering (artificial horizon, tapes, heading)
- **Orbitron + Share Tech Mono + Rajdhani** — Aerospace display fonts
- **CSS animations** — Radar sweep, engine fluctuation, alert blinking
- Pure CSS scanline overlay for authentic display feel
