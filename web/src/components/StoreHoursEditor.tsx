import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'

const DAYS = [
  { key: 'dom', label: 'Domingo' },
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sáb', label: 'Sábado' },
] as const

interface TimeRange {
  open: string
  close: string
}

interface DayHours {
  closed: boolean
  ranges: TimeRange[]
}

export function parseHoursText(text: string): DayHours[] {
  const block = { closed: false, ranges: [{ open: '08:00', close: '18:00' }] as TimeRange[] }
  const defaults: DayHours[] = DAYS.map(() => ({ ...block, ranges: [...block.ranges] }))
  if (!text) return defaults

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const match = line.match(/^([A-Za-zÀ-ÿ-]+)\s*:\s*(.+)$/)
    if (!match) continue
    const dayPart = match[1].trim().toLowerCase()
    const timePart = match[2].trim()

    const dayIdx = DAYS.findIndex((d) => dayPart.includes(d.key))
    if (dayIdx === -1) continue

    if (/fechado|fecha|closed/i.test(timePart)) {
      defaults[dayIdx].closed = true
      defaults[dayIdx].ranges = []
    } else if (timePart) {
      const rawRanges = timePart.split(/[e,]/i).map((s) => s.trim()).filter(Boolean)
      const ranges: TimeRange[] = rawRanges.map((r) => {
        const cleaned = r.replace(/h/g, ':').replace(/\s/g, '')
        const parts = cleaned.split(/[-–—]/).filter(Boolean)
        if (parts.length >= 2) {
          return { open: normalizeTime(parts[0]), close: normalizeTime(parts[parts.length - 1]) }
        }
        return null
      }).filter(Boolean) as TimeRange[]

      defaults[dayIdx].closed = false
      defaults[dayIdx].ranges = ranges.length > 0 ? ranges : [{ open: '08:00', close: '18:00' }]
    }
  }
  return defaults
}

function normalizeTime(t: string): string {
  const digits = t.replace(/\D/g, '')
  if (digits.length <= 2) return `${digits.padStart(2, '0')}:00`
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
}

function formatHour(t: string): string {
  const [h, m] = t.split(':')
  const num = parseInt(h, 10)
  return `${num}h${m === '00' ? '' : m}`
}

function rangesEqual(a: TimeRange[], b: TimeRange[]) {
  if (a.length !== b.length) return false
  return a.every((r, i) => r.open === b[i].open && r.close === b[i].close)
}

export function toHoursText(hours: DayHours[]): string {
  const groups: { start: number; end: number; hours: DayHours }[] = []
  let i = 0
  while (i < hours.length) {
    const current = hours[i]
    let j = i
    while (
      j + 1 < hours.length &&
      hours[j + 1].closed === current.closed &&
      rangesEqual(hours[j + 1].ranges, current.ranges)
    ) {
      j++
    }
    groups.push({ start: i, end: j, hours: current })
    i = j + 1
  }

  return groups
    .map((g) => {
      const dayLabel =
        g.start === g.end
          ? DAYS[g.start].label.slice(0, 3)
          : `${DAYS[g.start].key.slice(0, 3)}-${DAYS[g.end].key.slice(0, 3)}`
      if (g.hours.closed) return `${dayLabel}: Fechado`
      const timeStr = g.hours.ranges
        .map((r) => `${formatHour(r.open)}-${formatHour(r.close)}`)
        .join(' e ')
      return `${dayLabel}: ${timeStr}`
    })
    .join('\n')
}

interface StoreHoursEditorProps {
  value: string
  onChange: (value: string) => void
}

export function StoreHoursEditor({ value, onChange }: StoreHoursEditorProps) {
  const [hours, setHours] = useState<DayHours[]>(() => parseHoursText(value))
  const pendingRef = useRef<DayHours[] | null>(null)

  useEffect(() => {
    setHours(parseHoursText(value))
  }, [value])

  function getBase() {
    return pendingRef.current || hours
  }

  function emit(next: DayHours[]) {
    pendingRef.current = next
    setHours(next)
    onChange(toHoursText(next))
  }

  function toggleDay(idx: number, closed: boolean) {
    const base = getBase()
    const next = base.map((d, i) => {
      if (i !== idx) return d
      if (closed) return { closed: true, ranges: [] }
      return { closed: false, ranges: [{ open: '08:00', close: '18:00' }] }
    })
    emit(next)
  }

  function updateRange(dayIdx: number, rangeIdx: number, patch: Partial<TimeRange>) {
    const base = getBase()
    const next = base.map((d, i) => {
      if (i !== dayIdx) return d
      const ranges = d.ranges.map((r, ri) => (ri === rangeIdx ? { ...r, ...patch } : r))
      return { ...d, ranges }
    })
    emit(next)
  }

  function addRange(dayIdx: number) {
    const base = getBase()
    const next = base.map((d, i) => {
      if (i !== dayIdx) return d
      return { ...d, ranges: [...d.ranges, { open: '13:00', close: '18:00' }] }
    })
    emit(next)
  }

  function removeRange(dayIdx: number, rangeIdx: number) {
    const base = getBase()
    const next = base.map((d, i) => {
      if (i !== dayIdx) return d
      const ranges = d.ranges.filter((_, ri) => ri !== rangeIdx)
      if (ranges.length === 0) return { closed: true, ranges: [] }
      return { ...d, ranges }
    })
    emit(next)
  }

  return (
    <div className="space-y-0">
      {DAYS.map((day, idx) => {
        const h = hours[idx]
        return (
          <div key={day.key} className="flex flex-wrap items-center gap-3 py-2 border-b border-base-200 last:border-0">
            <span className="w-20 text-sm font-medium">{day.label}</span>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={h.closed}
                onChange={(e) => toggleDay(idx, e.target.checked)}
              />
              <span className="text-xs opacity-60">Fechado</span>
            </label>

            {!h.closed && (
              <>
                {h.ranges.map((r, ri) => (
                  <div key={ri} className="flex items-center gap-0">
                    <div className="join">
                      <input
                        type="time"
                        value={r.open}
                        onChange={(e) => updateRange(idx, ri, { open: e.target.value })}
                        className="input input-bordered input-xs w-28 join-item"
                      />
                      <span className="join-item flex items-center px-1 text-xs opacity-50">às</span>
                      <input
                        type="time"
                        value={r.close}
                        onChange={(e) => updateRange(idx, ri, { close: e.target.value })}
                        className="input input-bordered input-xs w-28 join-item"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRange(idx, ri)}
                      className="btn btn-ghost btn-xs btn-square text-error ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRange(idx)}
                  className="btn btn-outline btn-xs gap-0.5 text-primary"
                >
                  <Plus size={14} /> horário
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
