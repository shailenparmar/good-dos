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
  const match = PRIORITY_OPTIONS.find(o => o.label.startsWith(q))
  return match ?? null
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

  // Track the highlighted date by VALUE (e.g. "2026-03-07"), not by index.
  // This avoids index-mismatch bugs when switching between filtered/unfiltered lists.
  const [tabbedDateValue, setTabbedDateValue] = useState<string | null>(null)

  const [lockedDate, setLockedDate] = useState<string | null>(null)
  const [lockedName, setLockedName] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const prefilling = useRef(false)
  const dateOptions = useMemo(() => generateDateOptions(), [])
  const allDateOptions = useMemo(() => monthDates ?? dateOptions, [monthDates, dateOptions])

  // Refs so global keydown always sees fresh values without re-registering the listener
  const stepRef = useRef(step)
  const inputValueRef = useRef(inputValue)
  const tabbedDateValueRef = useRef(tabbedDateValue)
  const lockedDateRef = useRef(lockedDate)
  const onPrevRef = useRef(onPrev)
  const onNextRef = useRef(onNext)
  allDateOptions && (allDateOptions, void 0) // keep lint happy
  const allDateOptionsRef = useRef(allDateOptions)
  allDateOptionsRef.current = allDateOptions // always fresh, no stale closure

  useEffect(() => { stepRef.current = step }, [step])
  useEffect(() => { inputValueRef.current = inputValue }, [inputValue])
  useEffect(() => { tabbedDateValueRef.current = tabbedDateValue }, [tabbedDateValue])
  useEffect(() => { lockedDateRef.current = lockedDate }, [lockedDate])
  useEffect(() => { onPrevRef.current = onPrev }, [onPrev])
  useEffect(() => { onNextRef.current = onNext }, [onNext])

  // Dates visible given current typed filter
  const filteredDateOptions = useMemo(() => {
    const q = inputValue.trim()
    if (!q) return allDateOptions
    return allDateOptions.filter(o => fuzzyMatch(q, o.label))
  }, [allDateOptions, inputValue])

  // Typing clears the tab-selection so calendar shows filter highlights instead
  useEffect(() => {
    setTabbedDateValue(null)
  }, [inputValue])

  // ─── Global Tab handler ────────────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Let tab work normally inside the edit panel
        if ((e.target as HTMLElement)?.closest?.('[data-edit-panel]')) return
        e.preventDefault()

        // Priority step: Tab is handled by the input's onKeyDown — just focus it
        if (stepRef.current === 'priority') {
          inputRef.current?.focus()
          return
        }

        // Name step (or any non-date step): reset back to date, resume from locked date
        if (stepRef.current !== 'date') {
          const prevDate = lockedDateRef.current
          setStep('date')
          setInputValue('')
          setLockedDate(null)
          setLockedName(null)
          setIsActive(true)
          setTabbedDateValue(prevDate) // keep the previously chosen date highlighted
          inputRef.current?.focus()
          return
        }

        // ── Date step: cycle through filtered (or all) options ──────────────
        setIsActive(true)
        inputRef.current?.focus()

        const query = inputValueRef.current.trim()
        const opts = query
          ? allDateOptionsRef.current.filter(o => fuzzyMatch(query, o.label))
          : allDateOptionsRef.current
        if (opts.length === 0) return

        const backward = e.shiftKey
        const current = tabbedDateValueRef.current
        const currentIdx = current ? opts.findIndex(o => o.value === current) : -1

        let nextIdx: number
        if (currentIdx === -1) {
          // Nothing selected yet
          if (backward) {
            nextIdx = opts.length - 1
          } else {
            const todayStr = toDateString(new Date())
            const todayIdx = opts.findIndex(o => o.value === todayStr)
            nextIdx = todayIdx >= 0 ? todayIdx : 0
          }
        } else {
          nextIdx = currentIdx + (backward ? -1 : 1)
          if (nextIdx >= opts.length) {
            if (!query) {
              onNextRef.current?.()
              requestAnimationFrame(() => {
                const newOpts = allDateOptionsRef.current
                if (newOpts.length > 0) setTabbedDateValue(newOpts[0].value)
              })
              return
            }
            nextIdx = 0 // wrap within filtered set
          } else if (nextIdx < 0) {
            if (!query) {
              onPrevRef.current?.()
              requestAnimationFrame(() => {
                const newOpts = allDateOptionsRef.current
                if (newOpts.length > 0) setTabbedDateValue(newOpts[newOpts.length - 1].value)
              })
              return
            }
            nextIdx = opts.length - 1 // wrap within filtered set
          }
        }

        setTabbedDateValue(opts[nextIdx].value)
        return
      }

      // Any printable key while nothing is focused → focus the input
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) return
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // ─── Emit filter/highlight changes to calendar ────────────────────────────
  useEffect(() => {
    if (!onDateFilterChange) return
    if (step !== 'date') {
      onDateFilterChange([], null)
      return
    }
    if (tabbedDateValue) {
      // A specific date is tabbed — show just that one highlighted
      onDateFilterChange([tabbedDateValue], tabbedDateValue)
      return
    }
    if (isActive && inputValue.trim()) {
      // Typing filter — highlight all matches
      const dates = filteredDateOptions.map(o => o.value)
      onDateFilterChange(dates, dates[0] ?? null)
      return
    }
    onDateFilterChange([], null)
  }, [step, isActive, tabbedDateValue, filteredDateOptions, inputValue, onDateFilterChange])

  // Emit locked date to calendar
  useEffect(() => {
    onLockedDateChange?.(lockedDate)
  }, [lockedDate, onLockedDateChange])

  // Handle prefill from clicking a day cell
  useEffect(() => {
    if (prefillDate) {
      prefilling.current = true
      setLockedDate(prefillDate)
      setStep('name')
      setInputValue('')
      setTabbedDateValue(null)
      setIsActive(true)
      onClearPrefill()
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        requestAnimationFrame(() => { prefilling.current = false })
      })
    }
  }, [prefillDate, onClearPrefill])

  const reset = useCallback(() => {
    setStep('date')
    setInputValue('')
    setTabbedDateValue(null)
    setLockedDate(null)
    setLockedName(null)
    setIsActive(false)
  }, [])

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
      setTabbedDateValue(null)
    }
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [isActive])

  const matchedPriority = useMemo(() => {
    if (step !== 'priority') return null
    return matchPriority(inputValue)
  }, [step, inputValue])

  // ─── Input keydown ─────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (step === 'priority') { setLockedName(null); setStep('name'); setInputValue(''); return }
      if (step === 'name') { setLockedDate(null); setStep('date'); setInputValue(''); return }
      reset()
      inputRef.current?.blur()
      onEscape?.()
      return
    }

    if (step === 'date') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const opts = filteredDateOptions.length > 0 ? filteredDateOptions : allDateOptions
        if (opts.length === 0) return
        const dir = e.key === 'ArrowUp' ? -1 : 1
        const currentIdx = tabbedDateValue ? opts.findIndex(o => o.value === tabbedDateValue) : -1
        const next = (currentIdx + dir + opts.length) % opts.length
        setTabbedDateValue(opts[next].value)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected =
          (tabbedDateValue && allDateOptions.find(o => o.value === tabbedDateValue))
          ?? filteredDateOptions[0]
          ?? allDateOptions[0]
        if (selected) {
          setLockedDate(selected.value)
          setTabbedDateValue(null)
          setStep('name')
          setInputValue('')
          setIsActive(true)
        }
      }
    } else if (step === 'name') {
      if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault()
        setLockedDate(null)
        setStep('date')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const name = inputValue.trim()
        if (name) { setLockedName(name); setStep('priority'); setInputValue('') }
      }
    } else if (step === 'priority') {
      if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault(); setLockedName(null); setStep('name'); return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const cur = PRIORITY_OPTIONS.findIndex(o => o.label.startsWith(inputValue.toLowerCase().trim()))
        const next = e.shiftKey
          ? (((cur === -1 ? 0 : cur) - 1 + PRIORITY_OPTIONS.length) % PRIORITY_OPTIONS.length)
          : (((cur === -1 ? -1 : cur) + 1) % PRIORITY_OPTIONS.length)
        setInputValue(PRIORITY_OPTIONS[next].label)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (lockedDate && lockedName) {
          const priority = matchedPriority ?? PRIORITY_OPTIONS[0]
          onCreateTask(lockedName, lockedDate, priority.value)
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

        {/* LEFT — nav arrows + today button */}
        {onPrev && onNext && (
          <div className="flex-shrink-0 flex items-stretch gap-0">
            <button onClick={onPrev} className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{ fontSize: 'clamp(22px, 3vw, 36px)', color: 'hsl(var(--h), var(--s), var(--l))', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.08)', border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)', padding: '0 var(--sp-md-r)' }}>
              ‹
            </button>
            <button onClick={onToday} className="font-mono font-black flex flex-col items-center justify-center uppercase active:scale-90"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', padding: '0 var(--sp-sm-r)', lineHeight: 1.1, border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)' }}>
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>{(monthTitle?.split(' ')[0] ?? '').slice(0, 3)} {new Date().getDate()}</span>
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>{monthTitle?.split(' ')[1] ?? ''}</span>
            </button>
            <button onClick={onNext} className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{ fontSize: 'clamp(22px, 3vw, 36px)', color: 'hsl(var(--h), var(--s), var(--l))', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.08)', border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)', padding: '0 var(--sp-md-r)' }}>
              ›
            </button>
          </div>
        )}

        {/* BREADCRUMB — locked date chip */}
        {lockedDate && step !== 'date' && (() => {
          const { dayName, dayNum } = formatCalendarDay(lockedDate)
          return (
            <div className="flex-shrink-0 flex items-center justify-center font-mono font-black uppercase"
              style={{ padding: '0 var(--sp-lg-r)', color: 'hsl(var(--h), var(--s), var(--l))', border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)', fontSize: 'clamp(13px, 1.8vw, 20px)' }}>
              {dayName} {dayNum}
            </div>
          )
        })()}

        {/* BREADCRUMB — locked name chip */}
        {lockedName && step === 'priority' && (
          <div className="flex-shrink-0 flex items-center justify-center font-mono font-black truncate"
            style={{ padding: '0 var(--sp-lg-r)', maxWidth: 'clamp(100px, 18vw, 200px)', color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }}>
            {lockedName}
          </div>
        )}

        {/* CENTER — input or flash message */}
        <div className="flex-1 min-w-0 relative">
          {flashMessage ? (
            <div className="w-full font-mono font-black text-center uppercase"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(22px, 3vw, 36px)', border: '12px solid hsl(var(--h), var(--s), var(--l))', padding: 'var(--sp-md-r)' }}>
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

        {/* RIGHT — view toggle + colors */}
        <div className="flex-shrink-0 flex items-stretch gap-0">
          {onViewChange && (
            <>
              <button onClick={() => onViewChange('week')} className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
                style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: `${viewMode === 'week' ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${viewMode === 'week' ? 0.7 : 0.2})`, padding: '0 var(--sp-sm-r)' }}>
                week
              </button>
              <button onClick={() => onViewChange('month')} className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
                style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: `${viewMode === 'month' ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${viewMode === 'month' ? 0.7 : 0.2})`, padding: '0 var(--sp-sm-r)' }}>
                month
              </button>
            </>
          )}
          {onSettings && (
            <button onClick={onSettings} className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)', border: `${colorsOpen ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${colorsOpen ? 0.7 : 0.2})`, padding: '0 var(--sp-sm-r)' }}>
              colors
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
