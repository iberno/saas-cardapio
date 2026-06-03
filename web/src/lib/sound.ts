let ctx: AudioContext | null = null
let unlocked = false

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function unlock() {
  if (unlocked) return
  const c = getCtx()
  if (c.state === "suspended") c.resume()
  unlocked = true
}

if (typeof document !== "undefined") {
  const events = ["click", "touchstart", "keydown"]
  const handler = () => { unlock(); events.forEach((e) => document.removeEventListener(e, handler)) }
  events.forEach((e) => document.addEventListener(e, handler))
}

function play(freq1: number, freq2: number, dur: number, vol: number) {
  try {
    const c = getCtx()
    if (c.state === "suspended") c.resume()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = "sine"
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur)
    osc.frequency.setValueAtTime(freq1, c.currentTime)
    osc.frequency.setValueAtTime(freq2, c.currentTime + 0.2)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + dur)
  } catch {}
}

export function playNewOrderSound() {
  play(880, 660, 0.6, 0.3)
}

export function playBeep() {
  play(800, 800, 0.15, 0.2)
}
