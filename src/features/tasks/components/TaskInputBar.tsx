import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { toDateString, fuzzyMatch } from '@shared/utils/date'

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
  { label: 'medium', value: 1, color: 'hsl(45, 90%, 55%)' },
  { label: 'high', value: 2, color: 'hsl(0, 80%, 55%)' },
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
}

export function TaskInputBar({ onCreateTask, prefillDate, onClearPrefill, onDateFilterChange, onLockedDateChange, resetKey, monthDates, monthTitle, onSettings, onPrev, onNext }: TaskInputBarProps) {
  const [step, setStep] = useState<Step>('date')
  const [inputValue, setInputValue] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const [lockedDate, setLockedDate] = useState<string | null>(null)
  const [lockedDateLabel, setLockedDateLabel] = useState<string | null>(null)
  const [lockedName, setLockedName] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const prefilling = useRef(false)
  const dateOptions = useMemo(() => generateDateOptions(), [])

  const allDateOptions = useMemo(() => monthDates ?? dateOptions, [monthDates, dateOptions])

  const effectiveDateOptions = useMemo(() => {
    if (monthDates && inputValue.trim().length > 0) return monthDates
    return dateOptions
  }, [monthDates, dateOptions, inputValue])

  // Type anywhere to auto-focus input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
      const q = inputValue.trim()
      const pool = q.length > 0 ? effectiveDateOptions.filter(o => fuzzyMatch(inputValue, o.label)) : []
      // Always highlight the top match (or today when empty and active)
      if (pool.length > 0) {
        const dates = pool.map(o => o.value)
        const highlighted = pool[Math.min(highlightIndex, pool.length - 1)]?.value ?? null
        onDateFilterChange(dates, highlighted)
      } else if (isActive && q.length === 0 && allDateOptions.length > 0) {
        // Active with empty input → highlight today
        onDateFilterChange([allDateOptions[0].value], allDateOptions[0].value)
      } else {
        onDateFilterChange([], null)
      }
    } else {
      onDateFilterChange([], null)
    }
  }, [step, isActive, inputValue, highlightIndex, effectiveDateOptions, allDateOptions, onDateFilterChange])

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
      setLockedDateLabel(match?.label ?? prefillDate)
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

  const filteredDateOptions = useMemo(() => {
    return effectiveDateOptions.filter(o => fuzzyMatch(inputValue, o.label))
  }, [effectiveDateOptions, inputValue])

  useEffect(() => {
    setHighlightIndex(0)
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
      const options = filteredDateOptions
      if (e.key === 'Tab' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (e.shiftKey) {
          setHighlightIndex(i => (i - 1 + options.length) % options.length)
        } else {
          setHighlightIndex(i => (i + 1) % options.length)
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex(i => (i - 1 + options.length) % options.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Empty input → default to today (first option)
        const pool = options.length > 0 ? options : allDateOptions
        if (pool.length > 0) {
          const selected = pool[Math.min(highlightIndex, pool.length - 1)] ?? pool[0]
          setLockedDate(selected.value)
          setLockedDateLabel(selected.label)
          setStep('name')
          setInputValue('')
          setIsActive(true)
        }
      }
    } else if (step === 'name') {
      if (e.key === 'Enter') {
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
      : 'none / medium / high'

  // Border color reflects current state
  let borderColor = 'hsla(var(--h), var(--s), var(--l), 0.3)'
  if (step === 'priority' && matchedPriority) {
    borderColor = matchedPriority.color
  } else if (isActive) {
    borderColor = 'hsla(var(--h), var(--s), var(--l), 0.7)'
  }

  return (
    <div className="flex-shrink-0">
      <div className="flex items-stretch px-3 py-3 gap-2">
        {/* LEFT — month+day / year stacked, arrows alongside, full height */}
        {onPrev && onNext && (
          <div className="flex-shrink-0 flex items-stretch gap-0">
            <button
              onClick={onPrev}
              className="font-mono font-black rounded-sm active:scale-90 flex items-center justify-center uppercase"
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
            <div
              className="font-mono font-black flex flex-col items-center justify-center uppercase"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                padding: '0 clamp(4px, 0.8vw, 10px)',
                lineHeight: 1.1,
              }}
            >
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 20px)' }}>
                {monthTitle?.split(' ')[0] ?? ''} {new Date().getDate()}
              </span>
              <span style={{ fontSize: 'clamp(11px, 1.3vw, 14px)' }}>
                {monthTitle?.split(' ')[1] ?? ''}
              </span>
            </div>
            <button
              onClick={onNext}
              className="font-mono font-black rounded-sm active:scale-90 flex items-center justify-center uppercase"
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

        {/* BREADCRUMB SQUARES — to the right of nav, before input */}
        {lockedDateLabel && step !== 'date' && (
          <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-black rounded-sm uppercase"
            style={{
              padding: '0 clamp(8px, 1.2vw, 16px)',
              color: 'hsl(var(--h), var(--s), var(--l))',
              fontSize: 'clamp(13px, 1.8vw, 20px)',
              border: '6px solid hsla(var(--h), var(--s), var(--l), 0.5)',
              backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)',
            }}
          >
            {lockedDateLabel}
          </div>
        )}
        {lockedName && step === 'priority' && (
          <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-black rounded-sm truncate uppercase"
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

        {/* CENTER — THE INPUT */}
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
          className="flex-1 min-w-0 bg-transparent outline-none font-mono font-black text-center rounded-sm"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            caretColor: 'hsl(var(--h), var(--s), var(--l))',
            fontSize: 'clamp(22px, 3vw, 36px)',
            border: `12px solid ${borderColor}`,
            padding: 'clamp(6px, 1vw, 12px)',
          }}
        />

        {/* RIGHT — colors button */}
        {onSettings && (
          <button
            onClick={onSettings}
            className="flex-shrink-0 font-mono font-black rounded-sm active:scale-90 flex items-center justify-center uppercase"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              fontSize: 'clamp(13px, 1.8vw, 20px)',
              border: '3px solid hsla(var(--h), var(--s), var(--l), 0.5)',
              padding: '0 clamp(8px, 1.5vw, 20px)',
            }}
          >
            colors
          </button>
        )}
      </div>
    </div>
  )
}
