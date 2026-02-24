export function getRelativeDateText(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < -1) return `${Math.abs(diff)}d overdue`
  if (diff === -1) return 'yesterday'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff <= 7) return `in ${diff}d`
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isOverdue(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return target.getTime() < today.getTime()
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getTodayString(): string {
  return toDateString(new Date())
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - diff)
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const dd = new Date(d)
    dd.setDate(d.getDate() + i)
    days.push(dd)
  }
  return days
}

export function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const grid: (Date | null)[][] = []
  let day = 1

  for (let row = 0; row < 6; row++) {
    const week: (Date | null)[] = []
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < startDay) {
        week.push(null)
      } else if (day > totalDays) {
        week.push(null)
      } else {
        week.push(new Date(year, month, day))
        day++
      }
    }
    grid.push(week)
  }

  return grid
}

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const FULL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

export function formatCalendarDay(dateStr: string): { dayName: string; dayNum: number; monthStr: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    dayName: DAY_NAMES[d.getDay()],
    dayNum: d.getDate(),
    monthStr: MONTH_NAMES[d.getMonth()],
  }
}

export function formatCalendarMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

/**
 * Smart fuzzy match for date labels.
 * Handles shorthand like "m2" → "mon 2", "tu25" → "tue 25", "f" → all fridays.
 * Also full/partial day names: "thur" → all thursdays, "wednesday" → all wednesdays.
 * Also plain substring: "today", "tom", "28".
 */
export function fuzzyMatch(query: string, label: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true

  // Only letters and digits are meaningful — reject everything else early
  if (!/^[a-z0-9]+$/.test(q)) return false

  const labelLower = label.toLowerCase()
  const parts = labelLower.split(' ')

  // Labels can be 2 or 3 parts:
  //   "wed 25"           → dayName="wed", dateNum="25"
  //   "today mon 23"     → dayName="mon", dateNum="23", alias="today"
  //   "tomorrow tue 24"  → dayName="tue", dateNum="24", alias="tomorrow"
  const dayName = parts.length >= 3 ? parts[1] : parts[0]
  const dateNum = parts.length >= 3 ? parts[2] : parts[1]

  // Full day name matching: "thur" matches "thu 5" because both are prefixes of "thursday"
  const dayMatch = (prefix: string) =>
    FULL_DAY_NAMES.some(full => full.startsWith(prefix) && full.startsWith(dayName))

  // Pure letter query — match against start of any word in label or full day names
  // "tue" → all tuesdays, "thur" → all thursdays, "today" / "tom" → starts with
  if (/^[a-z]+$/.test(q)) {
    if (parts.some(p => p.startsWith(q))) return true
    if (dayMatch(q)) return true
    return false
  }

  // Number or shorthand: letter prefix + number suffix
  // "2" → date 2/20-29, "20" → date 20, "tue2" → tue 2/20-29, "tue25" → tue 25
  const shorthand = q.match(/^([a-z]*)(\d+)$/)
  if (!shorthand) return false

  const [, prefix, num] = shorthand

  if (prefix && !dayName.startsWith(prefix) && !dayMatch(prefix)) return false
  if (num) {
    if (!dateNum) return false
    if (dateNum !== num && !dateNum.startsWith(num)) return false
  }

  return true
}

export function getDateLabel(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return `today ${DAY_NAMES[target.getDay()]} ${target.getDate()}`
  if (diff === 1) return `tomorrow ${DAY_NAMES[target.getDay()]} ${target.getDate()}`
  return `${DAY_NAMES[target.getDay()]} ${target.getDate()}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getNextOccurrence(
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom',
  interval: number,
  fromDate: Date,
  daysOfWeek?: number[],
  dayOfMonth?: number
): Date {
  const next = new Date(fromDate)

  if (frequency === 'daily') {
    next.setDate(next.getDate() + interval)
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7 * interval)
  } else if (frequency === 'monthly') {
    const targetDay = dayOfMonth ?? fromDate.getDate()
    let newMonth = next.getMonth() + interval
    let newYear = next.getFullYear()
    while (newMonth > 11) {
      newMonth -= 12
      newYear++
    }
    const maxDay = daysInMonth(newYear, newMonth)
    next.setFullYear(newYear, newMonth, Math.min(targetDay, maxDay))
  } else if (frequency === 'custom' && daysOfWeek?.length) {
    const currentDay = next.getDay()
    const sorted = [...daysOfWeek].sort((a, b) => a - b)
    const nextDay = sorted.find(d => d > currentDay) ?? sorted[0]
    let daysUntil = nextDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    next.setDate(next.getDate() + daysUntil)
  }

  return next
}
