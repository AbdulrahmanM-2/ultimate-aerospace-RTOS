import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

// ─── Utility ────────────────────────────────────────────────────────────────
const rnd = (min, max) => Math.random() * (max - min) + min
const rndInt = (min, max) => Math.floor(rnd(min, max))

// ─── Task colours mapping ────────────────────────────────────────────────────
const TASK_COLORS = {
  green:  { bg: '#003820', border: '#00aa44', text: '#00ff88', active: '#00ff88' },
  purple: { bg: '#1a0844', border: '#6622cc', text: '#aa66ff', active: '#8844ff' },
  amber:  { bg: '#2a1400', border: '#aa6600', text: '#ffaa00', active: '#ffcc00' },
  blue:   { bg: '#001830', border: '#0055aa', text: '#0088ff', active: '#00aaff' },
  gray:   { bg: '#141c24', border: '#2a3c50', text: '#4a6070', active: '#5a7090' },
  red:    { bg: '#2a0808', border: '#aa2200', text: '#ff4444', active: '#ff2222' },
}

const TASK_GRID = [
  ['green','green','green','purple','amber','amber','purple'],
  ['green','green','green','purple','amber','amber','amber'],
  ['green','green','purple','amber','amber','blue','amber'],
  ['green','green','green','amber','amber','blue','amber'],
  ['green','green','green','amber','purple','blue','green'],
  ['green','green','green','amber','gray','gray',''],
]

// ─── Waveform Generator ──────────────────────────────────────────────────────
function generateWave(points, amplitude, noiseAmp) {
  return Array.from({ length: points }, (_, i) => ({
    x: i,
    y: 50 + Math.sin(i * 0.3) * amplitude + (Math.random() - 0.5) * noiseAmp
  }))
}

function pathFromPoints(pts, w, h, points) {
  return pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${(p.x / points) * w} ${p.y}`
  ).join(' ')
}

// ─── PFD Canvas ──────────────────────────────────────────────────────────────
function PFDCanvas({ pitch, roll, altitude, speed, heading }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#000810'
    ctx.fillRect(0, 0, W, H)

    // ── Artificial Horizon ──
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((roll * Math.PI) / 180)

    const pitchOffset = pitch * 3

    // Sky
    const skyGrad = ctx.createLinearGradient(0, -H, 0, 0)
    skyGrad.addColorStop(0, '#001840')
    skyGrad.addColorStop(1, '#003080')
    ctx.fillStyle = skyGrad
    ctx.fillRect(-W, -H - pitchOffset, W * 2, H)

    // Ground
    const gndGrad = ctx.createLinearGradient(0, 0, 0, H)
    gndGrad.addColorStop(0, '#3a1800')
    gndGrad.addColorStop(1, '#1a0800')
    ctx.fillStyle = gndGrad
    ctx.fillRect(-W, -pitchOffset, W * 2, H)

    // Horizon line
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-W / 2, -pitchOffset)
    ctx.lineTo(W / 2, -pitchOffset)
    ctx.stroke()

    // Pitch ladder
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '10px Share Tech Mono'
    ctx.lineWidth = 1
    for (let p = -30; p <= 30; p += 5) {
      if (p === 0) continue
      const y = -pitchOffset - p * 3
      const len = p % 10 === 0 ? 40 : 20
      ctx.beginPath()
      ctx.moveTo(-len, y)
      ctx.lineTo(len, y)
      ctx.stroke()
      if (p % 10 === 0) {
        ctx.fillText(Math.abs(p), len + 4, y + 4)
        ctx.fillText(Math.abs(p), -len - 20, y + 4)
      }
    }

    ctx.restore()

    // ── Fixed Aircraft Symbol ──
    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 2.5
    // Wings
    ctx.beginPath()
    ctx.moveTo(cx - 60, cy)
    ctx.lineTo(cx - 20, cy)
    ctx.lineTo(cx - 10, cy - 8)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + 60, cy)
    ctx.lineTo(cx + 20, cy)
    ctx.lineTo(cx + 10, cy - 8)
    ctx.stroke()
    // Fuselage center
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.strokeStyle = '#ffaa00'
    ctx.stroke()
    ctx.fillStyle = '#ffaa00'
    ctx.fill()

    // ── Roll indicator arc ──
    ctx.save()
    ctx.translate(cx, cy - 80)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(0, 0, 70, Math.PI + 0.3, -0.3)
    ctx.stroke()
    // Roll marks
    for (const angle of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
      ctx.save()
      ctx.rotate((angle * Math.PI) / 180)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -70)
      ctx.lineTo(0, angle % 30 === 0 ? -62 : -66)
      ctx.stroke()
      ctx.restore()
    }
    // Roll pointer
    ctx.save()
    ctx.rotate((roll * Math.PI) / 180)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -70)
    ctx.lineTo(-6, -60)
    ctx.lineTo(6, -60)
    ctx.closePath()
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.restore()
    ctx.restore()

    // ── Speed Tape (left) ──
    ctx.fillStyle = 'rgba(0,8,20,0.85)'
    ctx.fillRect(8, 20, 52, H - 40)
    ctx.strokeStyle = '#1a4060'
    ctx.lineWidth = 1
    ctx.strokeRect(8, 20, 52, H - 40)

    ctx.fillStyle = '#00ff88'
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.fillRect(12, cy - 12, 44, 24)
    ctx.fillStyle = '#000810'
    ctx.font = 'bold 14px Share Tech Mono'
    ctx.textAlign = 'center'
    ctx.fillText(Math.round(speed), 34, cy + 5)

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '9px Share Tech Mono'
    ctx.textAlign = 'right'
    for (let s = Math.round(speed / 10) * 10 - 50; s <= speed + 60; s += 10) {
      const y = cy - (s - speed) * 2.5
      if (y > 25 && y < H - 25) {
        ctx.fillText(s, 56, y + 3)
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(58, y)
        ctx.lineTo(62, y)
        ctx.stroke()
      }
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = '#00aaff'
    ctx.font = '8px Rajdhani'
    ctx.fillText('SPD', 10, 32)

    // ── Altitude Tape (right) ──
    const atX = W - 60
    ctx.fillStyle = 'rgba(0,8,20,0.85)'
    ctx.fillRect(atX, 20, 52, H - 40)
    ctx.strokeStyle = '#1a4060'
    ctx.lineWidth = 1
    ctx.strokeRect(atX, 20, 52, H - 40)

    ctx.fillStyle = '#00ff88'
    ctx.fillRect(atX + 4, cy - 12, 44, 24)
    ctx.fillStyle = '#000810'
    ctx.font = 'bold 13px Share Tech Mono'
    ctx.textAlign = 'center'
    ctx.fillText(Math.round(altitude), atX + 26, cy + 5)

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '9px Share Tech Mono'
    ctx.textAlign = 'left'
    for (let a = Math.round(altitude / 100) * 100 - 500; a <= altitude + 600; a += 100) {
      const y = cy - (a - altitude) * 0.04
      if (y > 25 && y < H - 25) {
        ctx.fillText(a, atX + 4, y + 3)
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(atX, y)
        ctx.lineTo(atX + 2, y)
        ctx.stroke()
      }
    }
    ctx.fillStyle = '#00aaff'
    ctx.font = '8px Rajdhani'
    ctx.fillText('ALT', atX + 4, 32)

    // ── Heading Bar (bottom) ──
    ctx.fillStyle = 'rgba(0,8,20,0.9)'
    ctx.fillRect(60, H - 28, W - 120, 22)
    ctx.strokeStyle = '#1a4060'
    ctx.lineWidth = 1
    ctx.strokeRect(60, H - 28, W - 120, 22)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Share Tech Mono'
    for (let dh = -60; dh <= 60; dh += 10) {
      const hdg = ((heading + dh) % 360 + 360) % 360
      const x = cx + dh * 2.2
      if (x > 65 && x < W - 65) {
        ctx.fillStyle = dh === 0 ? '#ffaa00' : 'rgba(255,255,255,0.5)'
        ctx.fillText(String(hdg).padStart(3, '0'), x, H - 12)
      }
    }
    // Heading pointer
    ctx.fillStyle = '#ffaa00'
    ctx.beginPath()
    ctx.moveTo(cx, H - 28)
    ctx.lineTo(cx - 6, H - 36)
    ctx.lineTo(cx + 6, H - 36)
    ctx.closePath()
    ctx.fill()

    // ── Flight Path Marker ──
    ctx.strokeStyle = '#00ffaa'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy - pitch * 2, 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 20, cy - pitch * 2)
    ctx.lineTo(cx - 8, cy - pitch * 2)
    ctx.moveTo(cx + 8, cy - pitch * 2)
    ctx.lineTo(cx + 20, cy - pitch * 2)
    ctx.moveTo(cx, cy - pitch * 2 - 8)
    ctx.lineTo(cx, cy - pitch * 2 - 16)
    ctx.stroke()

    // ── Vignette ──
    const vignette = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.8)
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)

  }, [pitch, roll, altitude, speed, heading])

  return <canvas ref={canvasRef} width={420} height={260} style={{ width: '100%', height: '100%' }} />
}

// ─── Radar Map ───────────────────────────────────────────────────────────────
function RadarMap({ threats }) {
  const canvasRef = useRef(null)
  const sweepAngle = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const R = Math.min(W, H) / 2 - 8

    let animId
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#020a06'
      ctx.fillRect(0, 0, W, H)

      // Grid rings
      for (let r = R / 4; r <= R; r += R / 4) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,180,60,0.25)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Cross hairs
      ctx.strokeStyle = 'rgba(0,180,60,0.2)'
      ctx.beginPath()
      ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy)
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R)
      ctx.stroke()

      // Sweep
      const grad = ctx.createConicalGradient
        ? ctx.createConicalGradient(cx, cy, sweepAngle.current - 1.2, sweepAngle.current)
        : null

      const sweepGrad = ctx.createConicGradient(0, cx, cy)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(sweepAngle.current)
      const sg = ctx.createLinearGradient(0, -R, 0, 0)
      sg.addColorStop(0, 'rgba(0,255,80,0)')
      sg.addColorStop(1, 'rgba(0,255,80,0.35)')
      ctx.fillStyle = sg
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R, -Math.PI * 0.25, 0)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      sweepAngle.current = (sweepAngle.current + 0.03) % (Math.PI * 2)

      // Clip to circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      // Threats
      threats.forEach(t => {
        const tx = cx + t.x * R
        const ty = cy + t.y * R
        const alpha = t.type === 'hostile' ? 1 : 0.7

        ctx.beginPath()
        ctx.arc(tx, ty, 4, 0, Math.PI * 2)
        ctx.fillStyle = t.type === 'hostile' ? '#ff3333' : t.type === 'friendly' ? '#00ff88' : '#ffaa00'
        ctx.fill()

        if (t.type === 'hostile') {
          const ping = (Date.now() % 2000) / 2000
          ctx.beginPath()
          ctx.arc(tx, ty, 4 + ping * 12, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,50,50,${1 - ping})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Trail
        ctx.strokeStyle = t.type === 'hostile' ? 'rgba(255,80,80,0.4)' : 'rgba(0,255,100,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(tx - t.vx * 20, ty - t.vy * 20)
        ctx.stroke()
      })

      ctx.restore()

      // Own ship
      ctx.fillStyle = '#00ffcc'
      ctx.beginPath()
      ctx.moveTo(cx, cy - 7)
      ctx.lineTo(cx - 4, cy + 5)
      ctx.lineTo(cx + 4, cy + 5)
      ctx.closePath()
      ctx.fill()

      // Range label
      ctx.fillStyle = 'rgba(0,200,60,0.5)'
      ctx.font = '8px Share Tech Mono'
      ctx.textAlign = 'left'
      ctx.fillText('10NM', cx + R / 4, cy + 3)
      ctx.fillText('20NM', cx + R / 2, cy + 3)
      ctx.fillText('40NM', cx + R * 0.9, cy + 3)

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [threats])

  return <canvas ref={canvasRef} width={180} height={180} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
}

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#00ff88', height = 50 }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 300
  const h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${color.replace('#','')})`} />
    </svg>
  )
}

// ─── Engine Gauge ────────────────────────────────────────────────────────────
function EngineGauge({ label, value, max = 100, color = '#00ff88' }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const stroke = (value / max) * circ * 0.75
  const offset = circ * 0.125

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#0a1f10" strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={-offset} strokeLinecap="round"
          transform="rotate(135 45 45)" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${stroke} ${circ - stroke}`}
          strokeDashoffset={-offset} strokeLinecap="round"
          transform="rotate(135 45 45)"
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 0.5s ease' }} />
        <text x="45" y="42" textAnchor="middle" fill={color} fontSize="14" fontFamily="Share Tech Mono" fontWeight="bold">
          {Math.round(value)}%
        </text>
        <text x="45" y="56" textAnchor="middle" fill="#4a6070" fontSize="8" fontFamily="Rajdhani">
          {label}
        </text>
      </svg>
    </div>
  )
}

// ─── Bar Meter ────────────────────────────────────────────────────────────────
function BarMeter({ label, value, max = 100, color = '#00ff88', animated = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: 14, height: 60,
        background: '#0a1520',
        border: `1px solid #1a3040`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${(value / max) * 100}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transition: 'height 0.5s ease',
          animation: animated ? 'engine-fluctuate 2s ease-in-out infinite' : 'none'
        }} />
        {[0.33, 0.66].map(t => (
          <div key={t} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${(1 - t) * 100}%`,
            height: 1, background: 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>
      <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Share Tech Mono' }}>{label}</span>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function AerospaceRTOS() {
  const [time, setTime] = useState(null)
  const [elapsedSec, setElapsedSec] = useState(5 * 3600 + 21 * 60 + 9)
  const [telemetry, setTelemetry] = useState({
    altitude: 11420, speed: 275, heading: 248,
    pitch: 2.5, roll: -2, vertSpeed: -220,
    cpuA: 24, cpuB: 38, memory: 45,
    n1a: 88, n1b: 61, n2a: 78, n2b: 69,
    fuel: 9630, fuelFlow: 2340,
    ias: 275, tas: 312, mach: 0.82,
    oat: -42, sat: -56,
  })
  const [cpuHistory, setCpuHistory] = useState(Array.from({ length: 60 }, () => rnd(20, 40)))
  const [memHistory, setMemHistory] = useState(Array.from({ length: 60 }, () => rnd(40, 55)))
  const [taskStates, setTaskStates] = useState({})
  const [threats] = useState([
    { x: -0.3, y: -0.5, vx: 0.02, vy: 0.01, type: 'hostile' },
    { x: 0.5, y: 0.2, vx: -0.01, vy: -0.02, type: 'friendly' },
    { x: -0.6, y: 0.4, vx: 0.015, vy: -0.01, type: 'unknown' },
    { x: 0.1, y: -0.7, vx: 0.005, vy: 0.02, type: 'hostile' },
  ])
  const [alertBlink, setAlertBlink] = useState(true)
  const [activeNav, setActiveNav] = useState('WEAPONS')
  const [activeModules, setActiveModules] = useState({
    weather: true, path: true, atc: true
  })
  const [threatDetected, setThreatDetected] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [mapZoom] = useState(1)

  // Live clock
  useEffect(() => {
    setTime(new Date())
    const id = setInterval(() => {
      setTime(new Date())
      setElapsedSec(s => s + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Telemetry updates
  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry(t => ({
        ...t,
        altitude: t.altitude + rnd(-8, 6),
        speed: Math.max(240, Math.min(320, t.speed + rnd(-1.5, 1.5))),
        heading: ((t.heading + rnd(-0.3, 0.3)) + 360) % 360,
        pitch: Math.max(-5, Math.min(8, t.pitch + rnd(-0.3, 0.3))),
        roll: Math.max(-15, Math.min(15, t.roll + rnd(-0.5, 0.5))),
        vertSpeed: Math.max(-500, Math.min(500, t.vertSpeed + rnd(-20, 20))),
        cpuA: Math.max(15, Math.min(75, t.cpuA + rnd(-3, 3))),
        cpuB: Math.max(20, Math.min(80, t.cpuB + rnd(-3, 3))),
        memory: Math.max(38, Math.min(72, t.memory + rnd(-1, 1.2))),
        n1a: Math.max(82, Math.min(96, t.n1a + rnd(-0.5, 0.5))),
        n1b: Math.max(56, Math.min(70, t.n1b + rnd(-0.5, 0.5))),
        n2a: Math.max(74, Math.min(88, t.n2a + rnd(-0.5, 0.5))),
        n2b: Math.max(64, Math.min(78, t.n2b + rnd(-0.5, 0.5))),
        fuel: Math.max(0, t.fuel - rnd(0.5, 2)),
        fuelFlow: Math.max(2000, Math.min(2800, t.fuelFlow + rnd(-30, 30))),
        oat: Math.max(-52, Math.min(-38, t.oat + rnd(-0.2, 0.2))),
      }))
      setCpuHistory(h => [...h.slice(-59), rnd(20, 75)])
      setMemHistory(h => [...h.slice(-59), rnd(38, 72)])
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Alert blink
  useEffect(() => {
    const id = setInterval(() => setAlertBlink(b => !b), 700)
    return () => clearInterval(id)
  }, [])

  const formatElapsed = (sec) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const formatTime = (d) => d ? `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}Z` : '--:--:--Z'

  const panel = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '6px 8px',
  }

  const panelHeader = {
    fontFamily: 'Orbitron, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    color: '#00aaff',
    letterSpacing: '0.12em',
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: 4,
  }

  return (
    <>
      <Head>
        <title>Ultimate Aerospace Real-Time RTOS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        width: '100vw', height: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Rajdhani, sans-serif',
      }}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div style={{
          height: 44, minHeight: 44,
          background: 'linear-gradient(180deg, #0c1828 0%, #080d14 100%)',
          borderBottom: '2px solid #1a4060',
          display: 'flex', alignItems: 'center',
          padding: '0 12px',
          gap: 12,
          boxShadow: '0 2px 20px rgba(0,100,200,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, #003880, #0055cc)',
              border: '1px solid #0088ff',
              borderRadius: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontFamily: 'Orbitron', color: '#00aaff', fontWeight: 700,
              boxShadow: '0 0 8px rgba(0,100,255,0.4)'
            }}>✈</div>
            <h1 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 18, fontWeight: 700,
              color: '#e0f0ff',
              letterSpacing: '0.05em',
              textShadow: '0 0 20px rgba(0,150,255,0.4)',
            }}>Ultimate Aerospace Real-Time RTOS</h1>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {['MOTION LS', 'WEAPONS', 'ADVANCED', 'ATC COMMS'].map(n => (
              <button key={n} onClick={() => setActiveNav(n)} style={{
                padding: '3px 10px',
                fontFamily: 'Orbitron', fontSize: 9, fontWeight: 600,
                letterSpacing: '0.08em',
                border: `1px solid ${activeNav === n ? '#00aaff' : '#1a4060'}`,
                borderRadius: 3,
                background: activeNav === n ? 'rgba(0,100,200,0.35)' : 'rgba(0,20,50,0.8)',
                color: activeNav === n ? '#00aaff' : '#5a7090',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeNav === n ? '0 0 8px rgba(0,100,200,0.4)' : 'none',
              }}>{n}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#00ff88' }}>{formatTime(time)}</span>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6070' }}>|</span>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#ffaa00' }}>FLT {formatElapsed(elapsedSec)}</span>
          </div>
        </div>

        {/* ── MAIN GRID ────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '240px 1fr 280px',
          gridTemplateRows: '1fr 1fr 1fr',
          gap: 4,
          padding: 4,
          overflow: 'hidden',
        }}>

          {/* ══ LEFT COL ══════════════════════════════════════════════ */}

          {/* Task Manager */}
          <div style={{ ...panel, gridRow: '1', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHeader}>
              <span>TASK MANAGER</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ color: '#00ff88', fontSize: 9 }}>42 ACTIVE</span>
                <span style={{ color: '#4a6070', fontSize: 9 }}>|</span>
                <span style={{ color: '#ffaa00', fontSize: 9 }}>6 QUEUED</span>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              flex: 1,
              overflow: 'hidden',
            }}>
              {TASK_GRID.map((row, ri) =>
                row.map((color, ci) => {
                  if (!color) return <div key={`${ri}-${ci}`} />
                  const c = TASK_COLORS[color]
                  const id = `${ri}-${ci}`
                  const isSelected = selectedTask === id
                  const taskNum = ri * 7 + ci + 1
                  const label = `TASK${taskNum > 9 ? taskNum : taskNum}`
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedTask(isSelected ? null : id)}
                      style={{
                        background: isSelected ? c.active : c.bg,
                        border: `1px solid ${isSelected ? c.active : c.border}`,
                        borderRadius: 2,
                        color: isSelected ? '#000' : c.text,
                        fontSize: 7,
                        fontFamily: 'Share Tech Mono',
                        cursor: 'pointer',
                        padding: '2px 1px',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? `0 0 6px ${c.active}` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minHeight: 18,
                      }}
                    >TASK{ri + 1}</button>
                  )
                })
              )}
            </div>
          </div>

          {/* AI Threat Detection */}
          <div style={{ ...panel, gridColumn: '2', gridRow: '1', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHeader}>
              <span>AI THREAT DETECTION</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ACTIVE', 'PASSIVE', 'FILTER', 'SUPPRESSION'].map(m => (
                  <button key={m} style={{
                    padding: '1px 6px', fontSize: 8,
                    fontFamily: 'Orbitron',
                    background: m === 'ACTIVE' ? 'rgba(255,50,50,0.2)' : 'rgba(0,20,50,0.8)',
                    border: `1px solid ${m === 'ACTIVE' ? '#ff3333' : '#1a4060'}`,
                    color: m === 'ACTIVE' ? '#ff6666' : '#4a6070',
                    borderRadius: 2, cursor: 'pointer',
                  }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              {/* Warning box */}
              <div style={{
                width: 160, flexShrink: 0,
                background: threatDetected ? 'rgba(255,100,0,0.1)' : 'rgba(0,50,20,0.2)',
                border: `1px solid ${threatDetected ? '#ff6600' : '#003820'}`,
                borderRadius: 3,
                padding: 8,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {threatDetected && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 6px',
                    background: 'rgba(255,100,0,0.15)',
                    border: '1px solid #ff6600',
                    borderRadius: 3,
                    animation: 'pulse-amber 1.5s infinite',
                  }}>
                    <span style={{ fontSize: 14 }}>⚠</span>
                    <span style={{ fontSize: 9, color: '#ffaa00', fontFamily: 'Orbitron', letterSpacing: '0.05em' }}>
                      DETECTED NEARBY THREAT
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['Notes', 'Runways', 'Fits', 'Supp', 'Tgt Lock', 'Dot', 'Item'].map(l => (
                    <button key={l} style={{
                      padding: '2px 5px', fontSize: 8,
                      fontFamily: 'Rajdhani', fontWeight: 600,
                      background: 'rgba(0,30,60,0.8)',
                      border: '1px solid #1a4060',
                      color: '#5a8090', borderRadius: 2, cursor: 'pointer',
                    }}>{l}</button>
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {threats.map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 9, fontFamily: 'Share Tech Mono',
                      color: t.type === 'hostile' ? '#ff6666' : t.type === 'friendly' ? '#00ff88' : '#ffaa00',
                      padding: '2px 4px',
                      background: 'rgba(0,10,20,0.5)',
                      borderLeft: `2px solid ${t.type === 'hostile' ? '#ff3333' : t.type === 'friendly' ? '#00aa44' : '#ffaa00'}`,
                    }}>
                      <span>{t.type.toUpperCase()}</span>
                      <span>{Math.round(Math.sqrt(t.x * t.x + t.y * t.y) * 40)}NM</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 8, color: '#4a6070', fontFamily: 'Share Tech Mono' }}>
                  TGT: {Math.round(telemetry.heading + 15)}° / {Math.round(rnd(8,15))}NM
                </div>
              </div>

              {/* Radar */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  fontSize: 8, color: '#4a6070', fontFamily: 'Share Tech Mono',
                  display: 'flex', gap: 8,
                }}>
                  <span style={{ color: '#ff6666' }}>● HOSTILE</span>
                  <span style={{ color: '#00ff88' }}>● FRDLY</span>
                  <span style={{ color: '#ffaa00' }}>● UNK</span>
                </div>
                <RadarMap threats={threats} />
                {/* Lat/long overlay */}
                <div style={{
                  position: 'absolute', bottom: 2, left: 2,
                  fontSize: 8, color: 'rgba(0,200,100,0.6)',
                  fontFamily: 'Share Tech Mono',
                }}>
                  {`${(39 + telemetry.heading * 0.001).toFixed(4)}°N ${(119 + telemetry.speed * 0.001).toFixed(4)}°E`}
                </div>
                <div style={{
                  position: 'absolute', top: 2, left: 2,
                  display: 'flex', gap: 4,
                }}>
                  {['RNG', 'BRG', 'TRK', 'WX'].map(b => (
                    <button key={b} style={{
                      padding: '1px 4px', fontSize: 7,
                      fontFamily: 'Orbitron',
                      background: 'rgba(0,10,20,0.8)',
                      border: '1px solid #1a3040',
                      color: '#4a6070', borderRadius: 2, cursor: 'pointer',
                    }}>{b}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Module Panel (top right) */}
          <div style={{ ...panel, gridColumn: '3', gridRow: '1', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHeader}>
              <span>MODULE SELECTION</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <button style={{ padding: '1px 5px', fontSize: 8, background: 'rgba(0,100,50,0.3)', border: '1px solid #005530', color: '#00aa44', borderRadius: 2, cursor: 'pointer' }}>▣</button>
                <button style={{ padding: '1px 5px', fontSize: 8, background: 'rgba(0,20,50,0.5)', border: '1px solid #1a4060', color: '#4a6070', borderRadius: 2, cursor: 'pointer' }}>⊟</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {[
                { key: 'weather', label: 'Weather Analysis', color: '#00ff88', status: 'PEAKS NOMINAL' },
                { key: 'path', label: 'Path Prediction', color: '#ffaa00', status: 'PEAKS NOMINAL' },
                { key: 'atc', label: 'ATC Comms', color: '#00aaff', status: 'PEAKS ENABLED' },
              ].map(mod => (
                <div key={mod.key} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '5px 8px',
                  background: activeModules[mod.key] ? `rgba(${mod.color === '#00ff88' ? '0,100,50' : mod.color === '#ffaa00' ? '100,60,0' : '0,80,150'},0.15)` : 'rgba(0,10,20,0.4)',
                  border: `1px solid ${activeModules[mod.key] ? mod.color + '44' : '#1a3040'}`,
                  borderRadius: 3,
                  gap: 8,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: activeModules[mod.key] ? mod.color : '#1a3040',
                    boxShadow: activeModules[mod.key] ? `0 0 6px ${mod.color}` : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontSize: 11, fontFamily: 'Rajdhani', fontWeight: 600, color: activeModules[mod.key] ? '#c0d8f0' : '#4a6070' }}>
                    {mod.label}
                  </span>
                  <span style={{ fontSize: 8, color: '#4a6070', fontFamily: 'Share Tech Mono' }}>{mod.status}</span>
                  <button
                    onClick={() => setActiveModules(m => ({ ...m, [mod.key]: !m[mod.key] }))}
                    style={{
                      width: 16, height: 16,
                      background: 'rgba(200,50,50,0.2)', border: '1px solid #aa3333',
                      color: '#ff6666', fontSize: 10, cursor: 'pointer', borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>✕</button>
                </div>
              ))}

              {/* AI Recommendation */}
              <div style={{
                marginTop: 4,
                padding: '6px 8px',
                background: 'rgba(0,60,120,0.2)',
                border: '1px solid #0055aa',
                borderRadius: 3,
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🔧</span>
                <div>
                  <div style={{ fontSize: 8, color: '#00aaff', fontFamily: 'Orbitron', marginBottom: 3 }}>AI RECOMMENDATION</div>
                  <div style={{ fontSize: 10, color: '#a0c0e0', fontFamily: 'Rajdhani', lineHeight: 1.4 }}>
                    Recommend descending to 9,000ft due to severe turbulence ahead. Suggest course deviation 15° left.
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  { label: 'THREAT LEVEL', value: 'MEDIUM', color: '#ffaa00' },
                  { label: 'FUEL STATE', value: 'NORMAL', color: '#00ff88' },
                  { label: 'SYS INTEGRITY', value: '98.2%', color: '#00ff88' },
                  { label: 'COMMS STATUS', value: 'ACTIVE', color: '#00aaff' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '4px 6px',
                    background: 'rgba(0,10,25,0.6)',
                    border: '1px solid #1a3040',
                    borderRadius: 3,
                  }}>
                    <div style={{ fontSize: 7, color: '#4a6070', fontFamily: 'Share Tech Mono' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: s.color, fontFamily: 'Orbitron', fontWeight: 600 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── System Status (left mid) ── */}
          <div style={{ ...panel, gridColumn: '1', gridRow: '2', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHeader}>
              <span>SYSTEM STATUS</span>
              <div style={{
                fontSize: 8, color: '#4a6070',
                display: 'flex', gap: 6,
              }}>
                <span style={{ color: '#ff6666' }}>● OVERLOAD</span>
                <span style={{ color: '#ffaa00' }}>● DEGRADED</span>
                <span style={{ color: '#5a7090' }}>● NOMINAL</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {[
                { label: 'CPU A', value: telemetry.cpuA, color: telemetry.cpuA > 80 ? '#ff3333' : telemetry.cpuA > 60 ? '#ffaa00' : '#00ff88' },
                { label: 'MEMORY', value: telemetry.memory, color: telemetry.memory > 80 ? '#ff3333' : telemetry.memory > 60 ? '#ffaa00' : '#8844ff' },
                { label: 'CPU B', value: telemetry.cpuB, color: telemetry.cpuB > 80 ? '#ff3333' : telemetry.cpuB > 60 ? '#ffaa00' : '#ffaa00' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1,
                  background: 'rgba(0,8,20,0.6)',
                  border: `1px solid ${s.color}33`,
                  borderRadius: 3,
                  padding: '4px 6px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 8, color: '#4a6070', fontFamily: 'Orbitron' }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontFamily: 'Share Tech Mono', color: s.color, fontWeight: 700, lineHeight: 1.2 }}>
                    {Math.round(s.value)}%
                  </div>
                  <div style={{ height: 3, background: '#0a1520', borderRadius: 2, marginTop: 2 }}>
                    <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 2, transition: 'width 0.5s', boxShadow: `0 0 4px ${s.color}` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '4px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid #1a3040',
              borderRadius: 3,
              marginBottom: 6,
            }}>
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 20, color: '#00ff88', letterSpacing: '0.1em', textShadow: '0 0 10px #00ff88' }}>
                {formatElapsed(elapsedSec)}
              </span>
            </div>

            <div style={{ fontSize: 8, color: '#4a6070', fontFamily: 'Orbitron', marginBottom: 3 }}>SYSTEM LOAD</div>
            <div style={{ height: 40, flex: 1 }}>
              <Sparkline data={cpuHistory} color="#00ff88" height={40} />
            </div>
            <div style={{ height: 30 }}>
              <Sparkline data={memHistory} color="#8844ff" height={30} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginTop: 4 }}>
              {[
                { label: 'TASKS', value: '42', color: '#00ff88' },
                { label: 'THREADS', value: '218', color: '#00aaff' },
                { label: 'IRQ/s', value: '1.2k', color: '#ffaa00' },
                { label: 'TEMP', value: '62°C', color: '#ff6666' },
                { label: 'UPTIME', value: '99.8%', color: '#00ff88' },
                { label: 'ERRORS', value: '0', color: '#00ff88' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '2px 4px', background: 'rgba(0,8,20,0.6)',
                  border: '1px solid #1a3040', borderRadius: 2, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 7, color: '#3a5060', fontFamily: 'Share Tech Mono' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: s.color, fontFamily: 'Share Tech Mono' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PFD / Allocation (center mid) ── */}
          <div style={{ ...panel, gridColumn: '2', gridRow: '2 / 4', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHeader}>
              <span>PRIMARY FLIGHT DISPLAY</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['FLIGHT MODE', 'NAV', 'APPR', 'HDG SEL', 'VS', 'ALT HOLD'].map(m => (
                  <button key={m} style={{
                    padding: '1px 5px', fontSize: 7, fontFamily: 'Orbitron',
                    background: ['NAV', 'ALT HOLD'].includes(m) ? 'rgba(0,200,100,0.2)' : 'rgba(0,20,50,0.8)',
                    border: `1px solid ${['NAV', 'ALT HOLD'].includes(m) ? '#00aa44' : '#1a4060'}`,
                    color: ['NAV', 'ALT HOLD'].includes(m) ? '#00ff88' : '#4a6070',
                    borderRadius: 2, cursor: 'pointer',
                  }}>{m}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#000810', borderRadius: 3, overflow: 'hidden' }}>
              <PFDCanvas
                pitch={telemetry.pitch}
                roll={telemetry.roll}
                altitude={telemetry.altitude}
                speed={telemetry.speed}
                heading={telemetry.heading}
              />
            </div>

            {/* Data bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(0,5,15,0.9)',
              border: '1px solid #1a3040',
              borderRadius: 3, padding: '4px 10px', marginTop: 4,
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Orbitron' }}>ALTITUDE</span>
                <span style={{ fontSize: 22, fontFamily: 'Share Tech Mono', color: '#00ff88', textShadow: '0 0 10px #00ff88' }}>
                  {Math.round(telemetry.altitude).toLocaleString()}
                </span>
                <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Rajdhani' }}>FT</span>
              </div>
              <div style={{ width: 1, height: 30, background: '#1a3040' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Orbitron' }}>IAS</span>
                <span style={{ fontSize: 22, fontFamily: 'Share Tech Mono', color: '#00aaff', textShadow: '0 0 10px #00aaff' }}>
                  {Math.round(telemetry.speed)}
                </span>
                <span style={{ fontSize: 9, color: '#4a6070' }}>KTS</span>
              </div>
              <div style={{ width: 1, height: 30, background: '#1a3040' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Orbitron' }}>HDG</span>
                <span style={{ fontSize: 22, fontFamily: 'Share Tech Mono', color: '#ffaa00' }}>
                  {String(Math.round(telemetry.heading)).padStart(3, '0')}°
                </span>
              </div>
              <div style={{ width: 1, height: 30, background: '#1a3040' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Orbitron' }}>V/S</span>
                <span style={{ fontSize: 22, fontFamily: 'Share Tech Mono', color: telemetry.vertSpeed < 0 ? '#ff6666' : '#00ff88' }}>
                  {telemetry.vertSpeed > 0 ? '+' : ''}{Math.round(telemetry.vertSpeed)}
                </span>
                <span style={{ fontSize: 9, color: '#4a6070' }}>FPM</span>
              </div>
              <div style={{ width: 1, height: 30, background: '#1a3040' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#4a6070', fontFamily: 'Orbitron' }}>MACH</span>
                <span style={{ fontSize: 22, fontFamily: 'Share Tech Mono', color: '#aa66ff' }}>
                  .{Math.round(telemetry.mach * 100)}
                </span>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {['◀', '⟳', 'AI', '○', 'P', '✕', '✕', '+'].map((b, i) => (
                  <button key={i} style={{
                    width: 24, height: 24,
                    background: b === 'AI' ? 'rgba(0,100,200,0.3)' : 'rgba(0,15,35,0.8)',
                    border: `1px solid ${b === 'AI' ? '#0055cc' : '#1a3040'}`,
                    color: b === 'AI' ? '#00aaff' : '#4a6070',
                    fontSize: 11, borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'Rajdhani', fontWeight: 700,
                  }}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── AI Vision + Modes (right mid) ── */}
          <div style={{ ...panel, gridColumn: '3', gridRow: '2', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              <div style={{ ...panelHeader, flex: 1, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                <span>AI MODES</span>
              </div>
              <div style={{ ...panelHeader, flex: 1, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                <span>AI VISION</span>
              </div>
            </div>
            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 6 }} />

            {/* AI Vision - camera feed simulation */}
            <div style={{
              flex: 1, position: 'relative',
              background: '#020810',
              borderRadius: 3, overflow: 'hidden',
              border: '1px solid #1a3040',
            }}>
              {/* Simulated camera view */}
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(180deg, #001830 0%, #002040 30%, #3a1800 55%, #1a0800 70%, #0a0405 100%)',
                position: 'relative',
              }}>
                {/* Horizon */}
                <div style={{
                  position: 'absolute', top: '48%', left: 0, right: 0,
                  height: 1, background: 'rgba(0,200,100,0.3)',
                }} />
                {/* Wing overlay */}
                <div style={{
                  position: 'absolute', bottom: '25%', left: '10%',
                  width: '35%', height: 2,
                  background: 'rgba(80,60,40,0.8)',
                  transform: 'rotate(3deg)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }} />
                {/* HUD overlays */}
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  fontFamily: 'Share Tech Mono', fontSize: 9, color: '#00ff88',
                  textShadow: '0 0 4px #00ff88',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div>BAND: VISUAL</div>
                  <div>ZOOM: 1.0x</div>
                </div>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  fontFamily: 'Share Tech Mono', fontSize: 9, color: '#00aaff',
                  textAlign: 'right',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div>REC●</div>
                  <div>4K/30</div>
                </div>
                {/* Target boxes */}
                {[
                  { x: 45, y: 30, w: 30, h: 20, label: 'CLOUD LAYER', color: '#00aaff' },
                  { x: 15, y: 55, w: 25, h: 15, label: 'TERRAIN', color: '#ffaa00' },
                ].map((box, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    left: `${box.x}%`, top: `${box.y}%`,
                    width: `${box.w}%`, height: `${box.h}%`,
                    border: `1px solid ${box.color}`,
                    boxShadow: `0 0 4px ${box.color}44`,
                  }}>
                    <span style={{
                      position: 'absolute', top: -12,
                      left: 0, fontSize: 7,
                      color: box.color, fontFamily: 'Share Tech Mono',
                    }}>{box.label}</span>
                    <div style={{ position: 'absolute', top: -1, left: -1, width: 5, height: 5, borderTop: `2px solid ${box.color}`, borderLeft: `2px solid ${box.color}` }} />
                    <div style={{ position: 'absolute', top: -1, right: -1, width: 5, height: 5, borderTop: `2px solid ${box.color}`, borderRight: `2px solid ${box.color}` }} />
                    <div style={{ position: 'absolute', bottom: -1, left: -1, width: 5, height: 5, borderBottom: `2px solid ${box.color}`, borderLeft: `2px solid ${box.color}` }} />
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 5, height: 5, borderBottom: `2px solid ${box.color}`, borderRight: `2px solid ${box.color}` }} />
                  </div>
                ))}
                {/* Crosshair */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                }}>
                  <svg width="30" height="30" style={{ opacity: 0.5 }}>
                    <line x1="15" y1="0" x2="15" y2="10" stroke="#00ff88" strokeWidth="1" />
                    <line x1="15" y1="20" x2="15" y2="30" stroke="#00ff88" strokeWidth="1" />
                    <line x1="0" y1="15" x2="10" y2="15" stroke="#00ff88" strokeWidth="1" />
                    <line x1="20" y1="15" x2="30" y2="15" stroke="#00ff88" strokeWidth="1" />
                    <circle cx="15" cy="15" r="3" stroke="#00ff88" strokeWidth="1" fill="none" />
                  </svg>
                </div>
              </div>

              {/* Bottom buttons */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                display: 'flex', justifyContent: 'space-between',
                padding: '4px 6px',
                background: 'rgba(0,5,15,0.8)',
                borderTop: '1px solid #1a3040',
              }}>
                {['◀ THERMAL', 'SELECT', 'TRACK', 'TM 4.100'].map(b => (
                  <button key={b} style={{
                    padding: '2px 6px', fontSize: 8,
                    fontFamily: 'Orbitron',
                    background: 'rgba(0,20,50,0.8)',
                    border: '1px solid #1a4060',
                    color: '#4a7090', borderRadius: 2, cursor: 'pointer',
                  }}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Engine & Systems (left bottom) ── */}
          <div style={{ ...panel, gridColumn: '1', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHeader}>
              <span>ENGINE & SYSTEMS</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <button style={{ padding: '1px 6px', fontSize: 8, fontFamily: 'Orbitron', background: 'rgba(0,20,50,0.8)', border: '1px solid #1a4060', color: '#4a6070', borderRadius: 2, cursor: 'pointer' }}>EICAS</button>
                <button style={{ padding: '1px 6px', fontSize: 8, fontFamily: 'Orbitron', background: 'rgba(200,50,50,0.2)', border: '1px solid #aa2200', color: '#ff6666', borderRadius: 2, cursor: 'pointer' }}>✕ RESET</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              {/* Bar meters */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                {[
                  { label: 'RB1', value: 82, color: '#00ff88' },
                  { label: 'N1%', value: 88, color: '#00ff88' },
                  { label: 'EGT', value: 65, color: '#ffaa00' },
                  { label: 'N2%', value: 78, color: '#00aaff' },
                ].map(b => (
                  <BarMeter key={b.label} label={b.label} value={b.value} color={b.color} animated />
                ))}
              </div>

              {/* Engine gauges */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                <EngineGauge label="ENG 1" value={telemetry.n1a} color="#00ff88" />
                <EngineGauge label="ENG 2" value={telemetry.n1b} color="#ffaa00" />
              </div>
            </div>

            {/* Fuel + system table */}
            <div style={{
              marginTop: 4,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 2,
              fontSize: 9,
              fontFamily: 'Share Tech Mono',
            }}>
              <div style={{ color: '#4a6070', textAlign: 'center' }}>N1%</div>
              <div style={{ color: '#4a6070', textAlign: 'center' }}>N2%</div>
              <div style={{ color: '#4a6070', textAlign: 'center' }}>FUEL</div>
              <div style={{ color: '#4a6070', textAlign: 'center' }}>FLOW</div>
              {[
                [Math.round(telemetry.n1a), Math.round(telemetry.n2a), Math.round(telemetry.fuel), Math.round(telemetry.fuelFlow)],
                [Math.round(telemetry.n1b), Math.round(telemetry.n2b), Math.round(telemetry.fuel * 0.98), Math.round(telemetry.fuelFlow * 0.95)],
              ].map((row, ri) =>
                row.map((v, ci) => (
                  <div key={`${ri}-${ci}`} style={{
                    textAlign: 'center', padding: '1px 2px',
                    background: 'rgba(0,8,20,0.6)', border: '1px solid #1a2a38', borderRadius: 2,
                    color: ci === 2 && v < 3000 ? '#ff3333' : '#00ff88',
                  }}>{v}</div>
                ))
              )}
            </div>

            {/* Bottom buttons */}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {['MENU', 'FUEL', 'ELEC', 'PRESS', 'HYD'].map(b => (
                <button key={b} style={{
                  flex: 1, padding: '3px 2px', fontSize: 9,
                  fontFamily: 'Orbitron',
                  background: 'rgba(0,15,35,0.8)',
                  border: '1px solid #1a4060',
                  color: '#4a7090', borderRadius: 3, cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}>{b}</button>
              ))}
            </div>
          </div>

          {/* ── Alert Panel (bottom right) ── */}
          <div style={{ ...panel, gridColumn: '3', gridRow: '3', display: 'flex', flexDirection: 'column' }}>
            {/* Severe turbulence */}
            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '8px 10px',
              background: alertBlink ? 'rgba(255,80,0,0.2)' : 'rgba(255,80,0,0.08)',
              border: `1px solid ${alertBlink ? '#ff5500' : '#882200'}`,
              borderRadius: 4, marginBottom: 6,
              transition: 'background 0.3s, border-color 0.3s',
            }}>
              <span style={{ fontSize: 28, filter: alertBlink ? 'drop-shadow(0 0 8px #ff6600)' : 'none', transition: 'filter 0.3s' }}>⚠</span>
              <div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 700, color: '#ffaa00', letterSpacing: '0.06em', lineHeight: 1.2 }}>
                  SEVERE<br />TURBULENCE<br />AHEAD
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{
                    padding: '4px 8px', fontFamily: 'Orbitron', fontSize: 9,
                    background: 'rgba(0,20,60,0.8)', border: '1px solid #1a4060',
                    color: '#4a7090', borderRadius: 3, cursor: 'pointer',
                  }}>🔍 ALERT</button>
                  <button style={{
                    padding: '4px 8px', fontFamily: 'Orbitron', fontSize: 9,
                    background: 'rgba(0,80,200,0.3)', border: '1px solid #0055cc',
                    color: '#00aaff', borderRadius: 3, cursor: 'pointer',
                  }}>↗ VECTOR</button>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{
                    flex: 1, padding: '4px 8px', fontFamily: 'Orbitron', fontSize: 9,
                    background: 'rgba(255,80,0,0.3)', border: '1px solid #ff5500',
                    color: '#ff8800', borderRadius: 3, cursor: 'pointer',
                    boxShadow: alertBlink ? '0 0 8px rgba(255,80,0,0.5)' : 'none',
                    transition: 'box-shadow 0.3s',
                  }}>ALERT</button>
                  <button style={{
                    flex: 1, padding: '4px 8px', fontFamily: 'Orbitron', fontSize: 9,
                    background: 'rgba(0,80,200,0.3)', border: '1px solid #0055cc',
                    color: '#00aaff', borderRadius: 3, cursor: 'pointer',
                  }}>VECTOR</button>
                </div>
              </div>
            </div>

            {/* ATC / Comms */}
            <div style={{
              fontSize: 9, fontFamily: 'Share Tech Mono',
              color: '#4a6070', marginBottom: 4,
            }}>
              <span style={{ color: '#00aaff' }}>♦ STT</span>
              <span style={{ marginLeft: 8 }}>ATC: RADAR CONTACT FL120 — DEVIATE LEFT 20° AVOID WX</span>
            </div>

            {/* Fire/warning panel */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, #1a0800, #0a0500)',
              border: '1px solid #3a1000',
              borderRadius: 3, overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'radial-gradient(ellipse at 30% 60%, rgba(255,80,0,0.3), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,40,0,0.2), transparent 50%)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: 4,
              }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 8, color: 'rgba(255,80,0,0.6)', letterSpacing: '0.1em' }}>
                  WX AVOIDANCE ACTIVE — REROUTING
                </div>
              </div>
              {/* Fire simulation particles */}
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  bottom: `${10 + i * 8}%`,
                  left: `${20 + i * 14}%`,
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: `rgba(255,${80 + i * 20},0,0.6)`,
                  filter: 'blur(4px)',
                  animation: `pulse-red ${0.8 + i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>

            {/* Status indicators */}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {[
                { label: 'TCAS', status: 'RA', color: '#ff3333' },
                { label: 'GPWS', status: 'OK', color: '#00ff88' },
                { label: 'WXR', status: 'ACT', color: '#ffaa00' },
                { label: 'STALL', status: 'OK', color: '#00ff88' },
                { label: 'FIRE', status: 'OK', color: '#00ff88' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: '3px 2px', textAlign: 'center',
                  background: 'rgba(0,8,20,0.8)',
                  border: `1px solid ${s.color}44`,
                  borderRadius: 3,
                }}>
                  <div style={{ fontSize: 7, color: '#3a5060', fontFamily: 'Share Tech Mono' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: s.color, fontFamily: 'Orbitron', fontWeight: 700 }}>{s.status}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes engine-fluctuate {
          0%, 100% { height: 70%; }
          25% { height: 76%; }
          50% { height: 67%; }
          75% { height: 73%; }
        }
        @keyframes pulse-red {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
        @keyframes pulse-amber {
          0%, 100% { box-shadow: 0 0 4px rgba(255,150,0,0.4); }
          50% { box-shadow: 0 0 14px rgba(255,150,0,0.8); }
        }
        button:hover { opacity: 0.85; }
      `}</style>
    </>
  )
}
