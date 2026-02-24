import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { toDateString, formatCalendarDay } from '@shared/utils/date'

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
  if (!q) return PRIORITY_OPTIONS[0] // default to "none" when empty
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
  onPrev?: () => void
  onNext?: () => void
  viewMode?: 'week' | 'month'
  onViewChange?: (mode: 'week' | 'month') => void
  onToday?: () => void
  flashMessage?: string | null
}

export function TaskInputBar({ onCreateTask, prefillDate, onClearPrefill, onDateFilterChange, onLockedDateChange, resetKey, monthDates, monthTitle, onSettings, onPrev, onNext, viewMode, onViewChange, onToday, flashMessage }: TaskInputBarProps) {
  const [step, setStep] = useState<Step>('date')
  const [inputValue, setInputValue] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const [tabbedDateIndex, setTabbedDateIndex] = useState<number | null>(null)
  const [lockedDate, setLockedDate] = useState<string | null>(null)
  const [lockedDateLabel, setLockedDateLabel] = useState<string | null>(null)
  const [lockedName, setLockedName] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const prefilling = useRef(false)
  const stepRef = useRef(step)
  const isActiveRef = useRef(isActive)
  const dateOptions = useMemo(() => generateDateOptions(), [])

  const allDateOptions = useMemo(() => monthDates ?? dateOptions, [monthDates, dateOptions])
  const allDateOptionsRef = useRef(allDateOptions)

  const onPrevRef = useRef(onPrev)
  const onNextRef = useRef(onNext)

  useEffect(() => { stepRef.current = step }, [step])
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { allDateOptionsRef.current = allDateOptions }, [allDateOptions])
  useEffect(() => { onPrevRef.current = onPrev }, [onPrev])
  useEffect(() => { onNextRef.current = onNext }, [onNext])

  // Filter dates by typed input
  const filteredDateOptions = useMemo(() => {
    const q = inputValue.toLowerCase().trim()
    if (!q) return allDateOptions
    return allDateOptions.filter(o => o.label.toLowerCase().includes(q))
  }, [allDateOptions, inputValue])

  // Type anywhere to auto-focus input; intercept Tab globally for date cycling
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Tab in date step — must capture globally before browser moves focus
      if (e.key === 'Tab' && stepRef.current === 'date') {
        e.preventDefault()
        const opts = allDateOptionsRef.current
        if (opts.length === 0) return
        setIsActive(true)
        const backward = e.shiftKey
        setTabbedDateIndex(prev => {
          // First tab → jump to today (or first/last if today not in list)
          if (prev === null) {
            const todayStr = new Date().toISOString().slice(0, 10)
            const todayIdx = opts.findIndex(o => o.value === todayStr)
            if (todayIdx >= 0) return todayIdx
            return backward ? opts.length - 1 : 0
          }
          const next = prev + (backward ? -1 : 1)
          // Past the end → advance to next period, land on first day
          if (next >= opts.length) {
            onNextRef.current?.()
            // After React processes the month change, set index to 0
            requestAnimationFrame(() => setTabbedDateIndex(0))
            return prev
          }
          // Before the start → go to previous period, land on last day
          if (next < 0) {
            onPrevRef.current?.()
            // After React processes the month change, set index to last
            requestAnimationFrame(() => {
              const newOpts = allDateOptionsRef.current
              setTabbedDateIndex(newOpts.length - 1)
            })
            return prev
          }
          return next
        })
        inputRef.current?.focus()
        return
      }

      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) return
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Emit filter changes to parent for calendar highlighting
  useEffect(() => {
    if (!onDateFilterChange) return
    if (step === 'date') {
      // Tab-cycling: highlight the single tabbed date
      if (tabbedDateIndex !== null && allDateOptions[tabbedDateIndex]) {
        const d = allDateOptions[tabbedDateIndex].value
        onDateFilterChange([d], d)
        return
      }
      // Text filtering: highlight all matching dates
      if (isActive && inputValue.trim()) {
        const dates = filteredDateOptions.map(o => o.value)
        onDateFilterChange(dates, dates[0] ?? null)
        return
      }
      if (isActive && allDateOptions.length > 0) {
        onDateFilterChange([allDateOptions[0].value], allDateOptions[0].value)
      } else {
        onDateFilterChange([], null)
      }
    } else {
      onDateFilterChange([], null)
    }
  }, [step, isActive, tabbedDateIndex, allDateOptions, filteredDateOptions, inputValue, onDateFilterChange])

  // Emit locked date so calendar can highlight the chosen cell
  useEffect(() => {
    onLockedDateChange?.(lockedDate)
  }, [lockedDate, onLockedDateChange])

  // Handle prefill from day cell click
  useEffect(() => {
    if (prefillDate) {
      prefilling.current = true
      const match = allDateOptions.find(o => o.value === prefillDate)
      setLockedDate(prefillDate)
      const fallback = (() => { const { dayName, dayNum } = formatCalendarDay(prefillDate); return `${dayName} ${dayNum}` })()
      setLockedDateLabel(match?.label ?? fallback)
      setStep('name')
      setInputValue('')
      setHighlightIndex(0)
      setIsActive(true)
      onClearPrefill()
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        // Clear flag after focus settles
        requestAnimationFrame(() => { prefilling.current = false })
      })
    }
  }, [prefillDate, allDateOptions, onClearPrefill])

  const reset = useCallback(() => {
    setStep('date')
    setInputValue('')
    setHighlightIndex(0)
    setTabbedDateIndex(null)
    setLockedDate(null)
    setLockedDateLabel(null)
    setLockedName(null)
    setIsActive(false)
  }, [])

  // External reset signal (e.g. clicking same day again)
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
      setHighlightIndex(0)
    }
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [isActive])

  useEffect(() => {
    setHighlightIndex(0)
    setTabbedDateIndex(null)
  }, [inputValue])

  // Priority match from current input
  const matchedPriority = useMemo(() => {
    if (step !== 'priority') return null
    return matchPriority(inputValue)
  }, [step, inputValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      reset()
      inputRef.current?.blur()
      return
    }

    if (step === 'date') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const opts = allDateOptions
        if (opts.length === 0) return
        const dir = e.key === 'ArrowUp' ? -1 : 1
        setTabbedDateIndex(prev => {
          const current = prev ?? -1
          return (current + dir + opts.length) % opts.length
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Select the tabbed date, or first filtered match, or first available
        const selected = (tabbedDateIndex !== null && allDateOptions[tabbedDateIndex])
          ? allDateOptions[tabbedDateIndex]
          : filteredDateOptions[0] ?? allDateOptions[0]
        if (selected) {
          setLockedDate(selected.value)
          setLockedDateLabel(selected.label)
          setTabbedDateIndex(null)
          setStep('name')
          setInputValue('')
          setIsActive(true)
        }
      }
    } else if (step === 'name') {
      if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault()
        setLockedDate(null)
        setLockedDateLabel(null)
        setStep('date')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const name = inputValue.trim()
        if (name) {
          setLockedName(name)
          setStep('priority')
          setInputValue('')
          setHighlightIndex(0)
        }
      }
    } else if (step === 'priority') {
      if (e.key === 'Backspace' && inputValue === '') {
        e.preventDefault()
        setLockedName(null)
        setStep('name')
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        // Cycle through priority options by setting the input to the next label
        const currentIdx = PRIORITY_OPTIONS.findIndex(o => o.label.startsWith(inputValue.toLowerCase().trim()))
        const nextIdx = e.shiftKey
          ? (((currentIdx === -1 ? 0 : currentIdx) - 1 + PRIORITY_OPTIONS.length) % PRIORITY_OPTIONS.length)
          : (((currentIdx === -1 ? -1 : currentIdx) + 1) % PRIORITY_OPTIONS.length)
        setInputValue(PRIORITY_OPTIONS[nextIdx].label)
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

  const placeholder = step === 'date'
    ? 'day...'
    : step === 'name'
      ? 'task...'
      : 'none / yellow / red'

  // Border color reflects current state
  let borderColor = 'hsla(var(--h), var(--s), var(--l), 0.3)'
  if (step === 'priority' && matchedPriority) {
    borderColor = matchedPriority.color
  } else if (isActive) {
    borderColor = 'hsla(var(--h), var(--s), var(--l), 0.7)'
  }

  return (
    <div className="flex-shrink-0">
      <div className="flex items-stretch px-3 py-1.5 gap-2">
        {/* LEFT — month+day / year stacked, arrows alongside, full height */}
        {onPrev && onNext && (
          <div className="flex-shrink-0 flex items-stretch gap-0">
            <button
              onClick={onPrev}
              className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{
                fontSize: 'clamp(22px, 3vw, 36px)',
                color: 'hsl(var(--h), var(--s), var(--l))',
                backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.08)',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.3)',
                padding: '0 clamp(4px, 0.8vw, 12px)',
              }}
            >
              ‹
            </button>
            <button
              onClick={onToday}
              className="font-mono font-black flex flex-col items-center justify-center uppercase active:scale-90"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                padding: '0 clamp(4px, 0.8vw, 10px)',
                lineHeight: 1.1,
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.3)',
              }}
            >
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>
                {(monthTitle?.split(' ')[0] ?? '').slice(0, 3)} {new Date().getDate()}
              </span>
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>
                {monthTitle?.split(' ')[1] ?? ''}
              </span>
            </button>
            <button
              onClick={onNext}
              className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{
                fontSize: 'clamp(22px, 3vw, 36px)',
                color: 'hsl(var(--h), var(--s), var(--l))',
                backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.08)',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.3)',
                padding: '0 clamp(4px, 0.8vw, 12px)',
              }}
            >
              ›
            </button>
          </div>
        )}

        {/* BREADCRUMB — locked date as "FRI 27" */}
        {lockedDate && step !== 'date' && (() => {
          const { dayName, dayNum } = formatCalendarDay(lockedDate)
          return (
            <div
              className="flex-shrink-0 flex items-center justify-center font-mono font-black uppercase"
              style={{
                padding: '0 clamp(8px, 1.2vw, 16px)',
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)',
                backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)',
                fontSize: 'clamp(13px, 1.8vw, 20px)',
              }}
            >
              {dayName} {dayNum}
            </div>
          )
        })()}
        {lockedName && step === 'priority' && (
          <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-black truncate"
            style={{
              padding: '0 clamp(8px, 1.2vw, 16px)',
              maxWidth: 'clamp(100px, 18vw, 200px)',
              color: 'hsl(var(--h), var(--s), var(--l))',
              fontSize: 'clamp(13px, 1.8vw, 20px)',
              border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)',
              backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)',
            }}
          >
            {lockedName}
          </div>
        )}

        {/* CENTER — THE INPUT or flash message */}
        <div className="flex-1 min-w-0 relative">
          {flashMessage ? (
            <div
              className="w-full font-mono font-black text-center uppercase"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                fontSize: 'clamp(22px, 3vw, 36px)',
                border: '12px solid hsl(var(--h), var(--s), var(--l))',
                padding: 'clamp(6px, 1vw, 12px)',
              }}
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
                  if (!inputRef.current?.matches(':focus')) {
                    reset()
                  }
                }, 150)
              }}
              placeholder={placeholder}
              className="w-full bg-transparent outline-none font-mono font-black text-center"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                caretColor: 'hsl(var(--h), var(--s), var(--l))',
                fontSize: 'clamp(22px, 3vw, 36px)',
                border: `12px solid ${borderColor}`,
                padding: 'clamp(6px, 1vw, 12px)',
              }}
            />
          )}
        </div>

        {/* RIGHT — view toggle + colors, adjacent like left nav */}
        <div className="flex-shrink-0 flex items-stretch gap-0">
          {onViewChange && (
            <>
              <button
                onClick={() => onViewChange('week')}
                className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
                style={{
                  color: 'hsl(var(--h), var(--s), var(--l))',
                  fontSize: 'clamp(13px, 1.8vw, 20px)',
                  border: `${viewMode === 'week' ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${viewMode === 'week' ? 1 : 0.2})`,
                  padding: '0 clamp(4px, 0.8vw, 8px)',
                }}
              >
                week
              </button>
              <button
                onClick={() => onViewChange('month')}
                className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
                style={{
                  color: 'hsl(var(--h), var(--s), var(--l))',
                  fontSize: 'clamp(13px, 1.8vw, 20px)',
                  border: `${viewMode === 'month' ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${viewMode === 'month' ? 1 : 0.2})`,
                  padding: '0 clamp(4px, 0.8vw, 8px)',
                }}
              >
                month
              </button>
            </>
          )}
          {onSettings && (
            <button
              onClick={onSettings}
              className="font-mono font-black active:scale-90 flex items-center justify-center uppercase"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                fontSize: 'clamp(13px, 1.8vw, 20px)',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
                padding: '0 clamp(4px, 0.8vw, 8px)',
              }}
            >
              colors
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
