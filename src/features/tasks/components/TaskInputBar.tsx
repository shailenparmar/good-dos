import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { toDateString, formatCalendarDay, fuzzyMatch } from '@shared/utils/date'

type Step = 'date' | 'name' | 'priority'

interface DateOption {
  label: string
  value: string
}

interface PriorityOption {
  label: string
  value: 0 | 1 | 2
  color: string
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  { label: 'none', value: 0, color: 'hsla(var(--h), var(--s), var(--l), 0.25)' },
  { label: 'yellow', value: 1, color: 'hsl(45, 90%, 55%)' },
  { label: 'red', value: 2, color: 'hsl(0, 80%, 55%)' },
]

function matchPriority(query: string): PriorityOption | null {
  const q = query.toLowerCase().trim()
  if (!q) return PRIORITY_OPTIONS[0]
  return PRIORITY_OPTIONS.find(o => o.label.startsWith(q)) ?? null
}

function generateDateOptions(): DateOption[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const options: DateOption[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    let label: string
    if (i === 0) label = `today ${dayNames[d.getDay()]} ${d.getDate()}`
    else if (i === 1) label = `tomorrow ${dayNames[d.getDay()]} ${d.getDate()}`
    else label = `${dayNames[d.getDay()]} ${d.getDate()}`
    options.push({ label, value: toDateString(d) })
  }
  return options
}

interface TaskInputBarProps {
  onCreateTask: (name: string, dueDate: string, priority: 0 | 1 | 2) => void
  prefillDate: string | null
  onClearPrefill: () => void
  onDateFilterChange?: (filteredDates: string[], highlightedDate: string | null) => void
  onLockedDateChange?: (dateStr: string | null) => void
  resetKey?: number
  hideDatePopup?: boolean
  monthDates?: DateOption[]
  monthTitle?: string
  onSettings?: () => void
  colorsOpen?: boolean
  onPrev?: () => void
  onNext?: () => void
  viewMode?: 'week' | 'month'
  onViewChange?: (mode: 'week' | 'month') => void
  onToday?: () => void
  flashMessage?: string | null
  onEscape?: () => void
}

export function TaskInputBar({ onCreateTask, prefillDate, onClearPrefill, onDateFilterChange, onLockedDateChange, resetKey, monthDates, monthTitle, onSettings, colorsOpen, onPrev, onNext, viewMode, onViewChange, onToday, flashMessage, onEscape }: TaskInputBarProps) {
  const [step, setStep] = useState<Step>('date')
  const [inputValue, setInputValue] = useState('')
  const [isActive, setIsActive] = useState(false)
  // The currently highlighted date value (e.g. "2026-03-07"), null = nothing highlighted
  const [tabbedDate, setTabbedDate] = useState<string | null>(null)
  const [lockedDate, setLockedDate] = useState<string | null>(null)
  const [lockedName, setLockedName] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const prefilling = useRef(false)
  const dateOptions = useMemo(() => generateDateOptions(), [])
  const allDateOptions = useMemo(() => monthDates ?? dateOptions, [monthDates, dateOptions])

  // Dates that match what's been typed (or all dates if nothing typed)
  const filteredDates = useMemo(() => {
    const q = inputValue.trim()
    if (!q) return allDateOptions
    return allDateOptions.filter(o => fuzzyMatch(q, o.label))
  }, [allDateOptions, inputValue])

  const matchedPriority = useMemo(() => {
    if (step !== 'priority') return null
    return matchPriority(inputValue)
  }, [step, inputValue])

  // Typing clears tab highlight so calendar shows filter highlights instead
  useEffect(() => {
    setTabbedDate(null)
  }, [inputValue])

  // Tell the calendar what to highlight
  useEffect(() => {
    if (!onDateFilterChange) return
    if (step !== 'date') { onDateFilterChange([], null); return }
    if (tabbedDate) { onDateFilterChange([tabbedDate], tabbedDate); return }
    if (isActive && inputValue.trim()) {
      const dates = filteredDates.map(o => o.value)
      onDateFilterChange(dates, dates[0] ?? null)
      return
    }
    onDateFilterChange([], null)
  }, [step, isActive, tabbedDate, filteredDates, inputValue, onDateFilterChange])

  // Tell the calendar which date is locked
  useEffect(() => {
    onLockedDateChange?.(lockedDate)
  }, [lockedDate, onLockedDateChange])

  // Clicking a day cell prefills the date and skips to name step
  useEffect(() => {
    if (!prefillDate) return
    prefilling.current = true
    setLockedDate(prefillDate)
    setStep('name')
    setInputValue('')
    setTabbedDate(null)
    setIsActive(true)
    onClearPrefill()
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      requestAnimationFrame(() => { prefilling.current = false })
    })
  }, [prefillDate, onClearPrefill])

  const reset = useCallback(() => {
    setStep('date')
    setInputValue('')
    setTabbedDate(null)
    setLockedDate(null)
    setLockedName(null)
    setIsActive(false)
  }, [])

  // External reset signal
  const resetKeyRef = useRef(resetKey)
  useEffect(() => {
    if (resetKey !== resetKeyRef.current) {
      resetKeyRef.current = resetKey
      reset()
      inputRef.current?.blur()
    }
  }, [resetKey, reset])

  const activate = useCallback(() => {
    if (prefilling.current) return
    if (!isActive) {
      setIsActive(true)
      setStep('date')
      setInputValue('')
      setTabbedDate(null)
    }
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [isActive])

  // Focus input when any printable key is pressed while nothing else is focused
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('[data-edit-panel]')) return
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) return
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  // ── All key handling in one place ──────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't intercept keys when inside the edit panel
    if ((e.target as HTMLElement)?.closest?.('[data-edit-panel]')) return

    if (e.key === 'Escape') {
      e.preventDefault()
      if (step === 'priority') { setLockedName(null); setStep('name'); setInputValue(''); return }
      if (step === 'name') { setLockedDate(null); setStep('date'); setInputValue(''); return }
      reset(); inputRef.current?.blur(); onEscape?.()
      return
    }

    if (step === 'date') {
      if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        // Use filtered list if there's a query, otherwise all dates
        const opts = filteredDates.length > 0 ? filteredDates : allDateOptions
        if (opts.length === 0) return
        const backward = e.shiftKey || e.key === 'ArrowUp'
        const currentIdx = tabbedDate ? opts.findIndex(o => o.value === tabbedDate) : -1
        let nextIdx: number
        if (currentIdx === -1) {
          // Nothing highlighted yet — start at today if visible, else first/last
          const todayStr = toDateString(new Date())
          const todayIdx = opts.findIndex(o => o.value === todayStr)
          nextIdx = backward ? opts.length - 1 : (todayIdx >= 0 ? todayIdx : 0)
        } else {
          // Wrap around within the list
          nextIdx = (currentIdx + (backward ? -1 : 1) + opts.length) % opts.length
        }
        setTabbedDate(opts[nextIdx].value)
        setIsActive(true)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected =
          (tabbedDate && allDateOptions.find(o => o.value === tabbedDate))
          ?? filteredDates[0]
          ?? allDateOptions[0]
        if (selected) {
          setLockedDate(selected.value)
          setTabbedDate(null)
          setStep('name')
          setInputValue('')
          setIsActive(true)
        }
      }
    } else if (step === 'name') {
      if (e.key === 'Tab') { e.preventDefault(); return } // Tab does nothing in name step
      if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault(); setLockedDate(null); setStep('date')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const name = inputValue.trim()
        if (name) { setLockedName(name); setStep('priority'); setInputValue('') }
      }
    } else if (step === 'priority') {
      if (e.key === 'Tab') {
        e.preventDefault()
        const cur = PRIORITY_OPTIONS.findIndex(o => o.label.startsWith(inputValue.toLowerCase().trim()))
        const next = e.shiftKey
          ? (((cur === -1 ? 0 : cur) - 1 + PRIORITY_OPTIONS.length) % PRIORITY_OPTIONS.length)
          : (((cur === -1 ? -1 : cur) + 1) % PRIORITY_OPTIONS.length)
        setInputValue(PRIORITY_OPTIONS[next].label)
      } else if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault(); setLockedName(null); setStep('name')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (lockedDate && lockedName) {
          onCreateTask(lockedName, lockedDate, (matchedPriority ?? PRIORITY_OPTIONS[0]).value)
          reset()
        }
      }
    }
  }

  const placeholder = step === 'date' ? 'type a day' : step === 'name' ? 'task...' : 'none / yellow / red'

  let borderColor = 'hsla(var(--h), var(--s), var(--l), 0.2)'
  if (step === 'priority' && matchedPriority) borderColor = matchedPriority.color
  else if (isActive) borderColor = 'hsla(var(--h), var(--s), var(--l), 0.7)'

  return (
    <div className="flex-shrink-0">
      <div className="flex items-stretch" style={{ padding: 'var(--sp-sm) var(--sp-md)', gap: 'var(--sp-sm)' }}>

        {onPrev && onNext && (
          <div className="flex-shrink-0 flex items-stretch gap-0">
            <button
              onClick={onPrev}
              className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{ fontSize: 'clamp(22px, 3vw, 36px)', color: 'hsl(var(--h), var(--s), var(--l))', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.08)', border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)', padding: '0 var(--sp-md-r)' }}
            >‹</button>
            <button
              onClick={onToday}
              className="font-mono font-black flex flex-col items-center justify-center uppercase active:scale-90"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', padding: '0 var(--sp-sm-r)', lineHeight: 1.1, border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)' }}
            >
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>{(monthTitle?.split(' ')[0] ?? '').slice(0, 3)} {new Date().getDate()}</span>
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>{monthTitle?.split(' ')[1] ?? ''}</span>
            </button>
            <button
              onClick={onNext}
              className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{ fontSize: 'clamp(22px, 3vw, 36px)', color: 'hsl(var(--h), var(--s), var(--l))', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.08)', border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)', padding: '0 var(--sp-md-r)' }}
            >›</button>
          </div>
        )}

        {lockedDate && step !== 'date' && (() => {
          const { dayName, dayNum } = formatCalendarDay(lockedDate)
          return (
            <div
              className="flex-shrink-0 flex items-center justify-center font-mono font-black uppercase"
              style={{ padding: '0 var(--sp-lg-r)', color: 'hsl(var(--h), var(--s), var(--l))', border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)', fontSize: 'clamp(13px, 1.8vw, 20px)' }}
            >
              {dayName} {dayNum}
            </div>
          )
        })()}

        {lockedName && step === 'priority' && (
          <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-black truncate"
            style={{ padding: '0 var(--sp-lg-r)', maxWidth: 'clamp(100px, 18vw, 200px)', color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }}
          >
            {lockedName}
          </div>
        )}

        <div className="flex-1 min-w-0 relative">
          {flashMessage ? (
            <div
              className="w-full font-mono font-black text-center uppercase"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(22px, 3vw, 36px)', border: '12px solid hsl(var(--h), var(--s), var(--l))', padding: 'var(--sp-md-r)' }}
            >
              {flashMessage}
            </div>
          ) : (
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={activate}
              onBlur={() => {
                setTimeout(() => {
                  if (prefilling.current) return
                  if (!inputRef.current?.matches(':focus')) reset()
                }, 150)
              }}
              placeholder={placeholder}
              className="w-full bg-transparent outline-none font-mono font-black text-center"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', caretColor: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(22px, 3vw, 36px)', border: `12px solid ${borderColor}`, padding: 'var(--sp-md-r)' }}
            />
          )}
        </div>

        <div className="flex-shrink-0 flex items-stretch gap-0">
          {onViewChange && (
            <>
              <button
                onClick={() => onViewChange('week')}
                className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
                style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: `${viewMode === 'week' ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${viewMode === 'week' ? 0.7 : 0.2})`, padding: '0 var(--sp-sm-r)' }}
              >week</button>
              <button
                onClick={() => onViewChange('month')}
                className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
                style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: `${viewMode === 'month' ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${viewMode === 'month' ? 0.7 : 0.2})`, padding: '0 var(--sp-sm-r)' }}
              >month</button>
            </>
          )}
          {onSettings && (
            <button
              onClick={onSettings}
              className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: `${colorsOpen ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${colorsOpen ? 0.7 : 0.2})`, padding: '0 var(--sp-sm-r)' }}
            >colors</button>
          )}
        </div>

      </div>
    </div>
  )
}
