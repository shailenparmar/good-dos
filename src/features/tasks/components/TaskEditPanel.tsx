import { useState, useRef, useEffect } from 'react'
import { db } from '@shared/storage/db'
import { tagColor } from '../types'
import { toDateString } from '@shared/utils/date'
import type { Task, TypeTag, RecurrenceRule } from '../types'

interface TaskEditPanelProps {
  task: Task
  typetags: TypeTag[]
  onUpdate: (id: string, changes: Partial<Task>) => void
  onDelete: (id: string) => void
  onRemoveRecurrence: (id: string) => void
  onClose: () => void
}

const PRIORITY_COLORS = [
  'transparent',
  'hsl(45, 90%, 55%)',
  'hsl(0, 80%, 55%)',
] as const

const FREQ_OPTIONS = ['none', 'daily', 'weekly', 'monthly'] as const
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function TaskEditPanel({ task, typetags, onUpdate, onDelete, onRemoveRecurrence, onClose }: TaskEditPanelProps) {
  const [text, setText] = useState(task.text)
  const [addingTag, setAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync text when task changes externally
  useEffect(() => { setText(task.text) }, [task.text])

  // Focus tag input when adding
  useEffect(() => {
    if (addingTag) tagInputRef.current?.focus()
  }, [addingTag])

  // Trap Tab within the panel — use native listener so preventDefault fires before browser default
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button, input, [tabindex]'))
      if (focusable.length === 0) return
      const idx = focusable.indexOf(document.activeElement as HTMLElement)
      if (idx === -1) return
      e.preventDefault()
      e.stopPropagation()
      const next = e.shiftKey
        ? (idx <= 0 ? focusable.length - 1 : idx - 1)
        : (idx >= focusable.length - 1 ? 0 : idx + 1)
      focusable[next].focus()
    }
    panel.addEventListener('keydown', handleTab)
    return () => panel.removeEventListener('keydown', handleTab)
  }, [])

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

  const addTypetag = async () => {
    const name = newTagName.trim().toLowerCase()
    if (!name) return
    const id = generateId()
    await db.typetags.add({ id, name })
    onUpdate(task.id, { categoryId: id })
    setNewTagName('')
    setAddingTag(false)
  }

  const deleteTypetag = async (id: string) => {
    await db.typetags.delete(id)
    const tasksWithTag = await db.tasks.where('categoryId').equals(id).toArray()
    for (const t of tasksWithTag) {
      await db.tasks.update(t.id, { categoryId: undefined })
    }
  }

  // Recurrence helpers
  const freq = task.recurrence?.frequency
  const isCustomWeekly = freq === 'custom' || freq === 'weekly'

  const setFrequency = (f: typeof FREQ_OPTIONS[number]) => {
    // Toggle off: clicking active frequency or 'none' removes recurrence + children
    if (f === 'none' || f === activeFreq) {
      onRemoveRecurrence(task.id)
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
    // Changing frequency — remove old children first, then set new recurrence
    onRemoveRecurrence(task.id)
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
      data-edit-panel
      className="flex-shrink-0 flex flex-col"
      style={{
        gap: 'var(--sp-xs)',
        padding: 'var(--sp-sm) var(--sp-md)',
      }}
    >
      <div
        className="flex flex-col"
        style={{
          gap: 'var(--sp-xs)',
          padding: 'var(--sp-sm)',
          border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
        }}
      >
      <div className="flex items-center flex-wrap" style={{ gap: 'var(--sp-sm)' }}>

        {/* LEFT */}
        <div className="flex items-center flex-shrink-0" style={{ gap: 'var(--sp-sm)' }}>
        <input
          ref={nameRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={saveText}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); saveText() }
            if (e.key === 'Escape') { e.preventDefault(); onClose() }
          }}
          placeholder="task name..."
          size={Math.max(text.length || 10, 10)}
          className="bg-transparent outline-none font-mono font-black"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            fontSize: FONT,
            border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
            padding: '0 var(--sp-sm-r)',
          }}
        />

        {task.dueDate && (
          <>
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                const d = new Date(task.dueDate! + 'T00:00:00')
                d.setDate(d.getDate() - 1)
                onUpdate(task.id, { dueDate: toDateString(d) })
              }}
              className="font-mono font-black active:scale-90"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
                padding: '0 var(--sp-sm-r)',
                fontSize: 'clamp(22px, 3vw, 36px)',
              }}
            >‹</button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                const d = new Date(task.dueDate! + 'T00:00:00')
                d.setDate(d.getDate() + 1)
                onUpdate(task.id, { dueDate: toDateString(d) })
              }}
              className="font-mono font-black active:scale-90"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
                padding: '0 var(--sp-sm-r)',
                fontSize: 'clamp(22px, 3vw, 36px)',
              }}
            >›</button>
          </>
        )}

        {([0, 1, 2] as const).map(p => (
          <button
            key={p}
            onClick={() => onUpdate(task.id, { priority: p })}
            className="font-mono font-black active:scale-90 uppercase whitespace-nowrap"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              border: task.priority === p
                ? '6px solid hsl(var(--h), var(--s), var(--l))'
                : '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
              backgroundColor: task.priority === p && PRIORITY_COLORS[p] !== 'transparent'
                ? PRIORITY_COLORS[p]
                : 'transparent',
              padding: '0 var(--sp-sm-r)',
              fontSize: FONT,
            }}
          >
            {p === 0 ? 'none' : p === 1 ? 'medium' : 'high'}
          </button>
        ))}
        </div>

        {/* CENTER */}
        <div className="flex items-center flex-shrink-0 mx-auto" style={{ gap: 'var(--sp-sm)' }}>
        {typetags.map((tag, i) => {
          const color = tagColor(i)
          return (
            <button
              key={tag.id}
              onClick={() => onUpdate(task.id, { categoryId: task.categoryId === tag.id ? undefined : tag.id })}
              onKeyDown={e => { if (e.key === 'Backspace') { e.preventDefault(); deleteTypetag(tag.id) } }}
              className="font-mono font-black active:scale-90 uppercase whitespace-nowrap"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: `${task.categoryId === tag.id ? '6px' : '3px'} solid ${color}`,
                backgroundColor: task.categoryId === tag.id ? tagColor(i) : 'transparent',
                padding: '0 var(--sp-sm-r)',
                fontSize: FONT,
              }}
            >
              {tag.name}
            </button>
          )
        })}

        {addingTag ? (
          <input
            ref={tagInputRef}
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTypetag() }
              if (e.key === 'Escape') { e.preventDefault(); setAddingTag(false); setNewTagName('') }
            }}
            onBlur={() => {
              if (!newTagName.trim()) { setAddingTag(false); setNewTagName('') }
            }}
            placeholder="tag name..."
            className="bg-transparent outline-none font-mono font-black"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              fontSize: FONT,
              border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
              padding: '0 var(--sp-sm-r)',
              width: 'clamp(96px, 14.4vw, 192px)',
            }}
          />
        ) : (
          <button
            onClick={() => setAddingTag(true)}
            className="font-mono font-black active:scale-90 uppercase whitespace-nowrap"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
              padding: '0 var(--sp-sm-r)',
              fontSize: FONT,
            }}
          >
            + tag
          </button>
        )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center flex-shrink-0 ml-auto" style={{ gap: 'var(--sp-sm)' }}>
        {FREQ_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFrequency(f)}
            className="font-mono font-black active:scale-90 uppercase whitespace-nowrap"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              border: `${activeFreq === f ? '6px' : '3px'} solid hsla(var(--h), var(--s), var(--l), ${activeFreq === f ? 1 : 0.2})`,
              backgroundColor: activeFreq === f ? 'hsla(var(--h), var(--s), var(--l), 0.1)' : 'transparent',
              padding: '0 var(--sp-sm-r)',
              fontSize: FONT,
            }}
          >
            {f}
          </button>
        ))}

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

        <button
          onMouseDown={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="font-mono font-black active:scale-90 uppercase whitespace-nowrap"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
            padding: '0 var(--sp-sm-r)',
            fontSize: FONT,
          }}
        >
          DELETE TASK
        </button>
        </div>

      </div>
      </div>
    </div>
  )
}
