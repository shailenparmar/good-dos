import { useState, useRef, useEffect } from 'react'
import type { Task, Category, RecurrenceRule } from '../types'

interface TaskEditPanelProps {
  task: Task
  categories: Category[]
  onUpdate: (id: string, changes: Partial<Task>) => void
  onClose: () => void
}

const PRIORITY_COLORS = [
  'hsla(var(--h), var(--s), var(--l), 0.5)',
  'hsl(45, 90%, 55%)',
  'hsl(0, 80%, 55%)',
] as const

const FREQ_OPTIONS = ['none', 'daily', 'weekly', 'monthly'] as const
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']


export function TaskEditPanel({ task, categories, onUpdate, onClose }: TaskEditPanelProps) {
  const [text, setText] = useState(task.text)
  const [showRepeat, setShowRepeat] = useState(!!task.recurrence)
  const nameRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync text when task changes externally
  useEffect(() => { setText(task.text) }, [task.text])

  // Focus name on open
  useEffect(() => { nameRef.current?.focus() }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const saveText = () => {
    const trimmed = text.trim()
    if (trimmed && trimmed !== task.text) {
      onUpdate(task.id, { text: trimmed })
    }
  }

  // Recurrence helpers
  const freq = task.recurrence?.frequency
  const isCustomWeekly = freq === 'custom' || freq === 'weekly'

  const setFrequency = (f: typeof FREQ_OPTIONS[number]) => {
    if (f === 'none') {
      onUpdate(task.id, { recurrence: undefined })
      return
    }
    const base: RecurrenceRule = { frequency: f, interval: 1 }
    if (f === 'weekly') {
      base.frequency = 'custom'
      const day = task.dueDate ? new Date(task.dueDate + 'T00:00:00').getDay() : new Date().getDay()
      base.daysOfWeek = [day]
    }
    if (f === 'monthly' && task.dueDate) {
      base.dayOfMonth = new Date(task.dueDate + 'T00:00:00').getDate()
    }
    onUpdate(task.id, { recurrence: base })
  }

  const toggleDay = (day: number) => {
    if (!task.recurrence) return
    const current = task.recurrence.daysOfWeek ?? []
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b)
    if (next.length === 0) return
    onUpdate(task.id, { recurrence: { ...task.recurrence, daysOfWeek: next } })
  }

  const activeFreq = !task.recurrence ? 'none' : isCustomWeekly ? 'weekly' : freq

  const FONT = 'clamp(11px, 1.3vw, 14px)'

  return (
    <div
      ref={panelRef}
      className="flex-shrink-0 flex flex-col gap-1 mx-3 my-2 px-2 py-2"
      style={{
        border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
      }}
    >
      {/* Single row: name input + priority + categories + repeat — all stretch to fill */}
      <div className="flex items-stretch gap-2">
        <input
          ref={nameRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={saveText}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); nameRef.current?.blur() }
            if (e.key === 'Escape') { e.preventDefault(); onClose() }
          }}
          placeholder="task name..."
          className="flex-1 min-w-0 bg-transparent outline-none font-mono font-black"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            fontSize: FONT,
            border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
            padding: '0 clamp(4px, 0.6vw, 8px)',
          }}
        />

        {/* Priority squares */}
        {([0, 1, 2] as const).map(p => (
          <button
            key={p}
            onClick={() => onUpdate(task.id, { priority: p })}
            className="flex-shrink-0 active:scale-90 aspect-square"
            style={{
              backgroundColor: PRIORITY_COLORS[p],
              border: task.priority === p ? '6px solid hsl(var(--h), var(--s), var(--l))' : '3px solid transparent',
            }}
          />
        ))}

        {/* Categories */}
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => onUpdate(task.id, { categoryId: task.categoryId === c.id ? undefined : c.id })}
            className="flex-shrink-0 font-mono font-black active:scale-90 uppercase"
            style={{
              color: c.color,
              border: `${task.categoryId === c.id ? '6px' : '3px'} solid ${c.color}`,
              backgroundColor: task.categoryId === c.id ? c.color + '22' : 'transparent',
              padding: '0 clamp(4px, 0.8vw, 8px)',
              fontSize: FONT,
            }}
          >
            {c.name}
          </button>
        ))}

        {/* Repeat toggle */}
        <button
          onClick={() => setShowRepeat(s => !s)}
          className="flex-shrink-0 font-mono font-black active:scale-90 uppercase"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            border: `${task.recurrence ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${task.recurrence ? 1 : 0.2})`,
            padding: '0 clamp(4px, 0.8vw, 8px)',
            fontSize: FONT,
          }}
        >
          repeat
        </button>
      </div>

      {/* Recurrence row (expandable) */}
      {showRepeat && (
        <div className="flex items-stretch gap-1.5 flex-wrap">
          {FREQ_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className="font-mono font-black active:scale-90 uppercase"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: `${activeFreq === f ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${activeFreq === f ? 1 : 0.2})`,
                backgroundColor: activeFreq === f ? 'hsla(var(--h), var(--s), var(--l), 0.1)' : 'transparent',
                padding: '0 clamp(6px, 1vw, 10px)',
                fontSize: FONT,
              }}
            >
              {f}
            </button>
          ))}

          {/* Day-of-week toggles */}
          {isCustomWeekly && DAY_LABELS.map((label, i) => {
            const active = task.recurrence?.daysOfWeek?.includes(i) ?? false
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className="font-mono font-black active:scale-90 uppercase aspect-square"
                style={{
                  color: 'hsl(var(--h), var(--s), var(--l))',
                  border: `${active ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${active ? 1 : 0.2})`,
                  backgroundColor: active ? 'hsla(var(--h), var(--s), var(--l), 0.15)' : 'transparent',
                  fontSize: FONT,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
