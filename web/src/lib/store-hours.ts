const DAY_NAMES: Record<string, number[]> = {
  "dom": [0],
  "seg": [1],
  "ter": [2],
  "qua": [3],
  "qui": [4],
  "sex": [5],
  "sáb": [6],
  "sab": [6],
}

function parseDayRange(text: string): number[] | null {
  const parts = text.split(/-| a /i).map((p) => p.trim().toLowerCase())
  if (parts.length === 2) {
    const start = DAY_NAMES[parts[0]]
    const end = DAY_NAMES[parts[1]]
    if (start && end) {
      const days: number[] = []
      let d = start[0]
      while (true) {
        days.push(d)
        if (d === end[0]) break
        d = (d + 1) % 7
      }
      return days
    }
  }
  const single = DAY_NAMES[text.trim().toLowerCase()]
  if (single) return single
  return null
}

function extractMinutes(s: string): number {
  const digits = s.replace(/[^\d]/g, " ").trim()
  const [h = "0", m = "0"] = digits.split(/\s+/)
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

function parseTime(timeStr: string): { start: number; end: number } | null {
  const cleaned = timeStr.replace(/h/g, ":").replace(/\s/g, "")
  const parts = cleaned.split(/[-–—]|às|até/i).filter(Boolean)
  if (parts.length < 2) return null
  return { start: extractMinutes(parts[0]), end: extractMinutes(parts[parts.length - 1]) }
}

function parseRanges(timePart: string): { start: number; end: number }[] {
  return timePart.split(/[e,]/i).map((s) => s.trim()).filter(Boolean).map(parseTime).filter(Boolean) as { start: number; end: number }[]
}

export interface StoreOpenInfo {
  isOpen: boolean
  label: string
  nextOpen: string | null
}

export function getStoreOpenInfo(hoursText: string | null): StoreOpenInfo {
  if (!hoursText) return { isOpen: false, label: "Horário não informado", nextOpen: null }

  const now = new Date()
  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const lines = hoursText.split("\n").map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    const match = line.match(/^([A-Za-zÀ-ÿ-]+)\s*:\s*(.+)$/)
    if (!match) continue

    const dayPart = match[1].trim()
    const timePart = match[2].trim()

    if (/fechado|fecha/i.test(timePart)) continue

    const days = parseDayRange(dayPart)
    if (!days) continue

    if (!days.includes(currentDay)) continue

    const ranges = parseRanges(timePart)
    if (ranges.length === 0) continue

    const fmt = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`.replace("h00", "h")

    for (const r of ranges) {
      if (currentMinutes >= r.start && currentMinutes < r.end) {
        return { isOpen: true, label: `Aberto • ${fmt(r.start)} às ${fmt(r.end)}`, nextOpen: null }
      }
    }

    const nextRange = [...ranges].sort((a, b) => a.start - b.start).find((r) => currentMinutes < r.start)
    if (nextRange) {
      return { isOpen: false, label: "Fechado agora", nextOpen: `Abre às ${fmt(nextRange.start)}` }
    }

    return { isOpen: false, label: "Fechado agora", nextOpen: null }
  }

  for (const line of lines) {
    const match = line.match(/^([A-Za-zÀ-ÿ-]+)\s*:\s*(.+)$/)
    if (!match) continue
    const timePart = match[2].trim()
    if (/fechado|fecha/i.test(timePart)) continue
    const ranges = parseRanges(timePart)
    if (ranges.length === 0) continue
    const fmt = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`.replace("h00", "h")
    return { isOpen: false, label: "Fechado hoje", nextOpen: `Próximo horário: ${fmt(ranges[0].start)}` }
  }

  return { isOpen: false, label: "Fechado hoje", nextOpen: null }
}
