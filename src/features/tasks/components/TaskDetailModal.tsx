import { useState, useEffect, useRef } from 'react'
import type { Task, Category } from '../types'
import { RecurrencePicker } from './RecurrencePicker'
import { FunctionButton } from '@shared/components/FunctionButton'
import { getRelativeDateText, isOverdue } from '@shared/utils/date'

interface TaskDetailModalProps {
  task: Task
  categories: Category[]
  onUpdate: (id: string, changes: Partial<Task>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function TaskDetailModal({ task, categories, onUpdate, onDelete, onClose }: TaskDetailModalProps) {
  const [text, setText] = useState(task.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleTextBlur = () => {
    if (text !== task.text) {
      onUpdate(task.id, { text })
    }
  }

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputRef.current?.blur()
    }
  }

  const handleDelete = () => {
    onDelete(task.id)
    onClose()
  }

  const overdue = task.dueDate ? isOverdue(task.dueDate) : false

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'hsla(var(--bh), var(--bs), var(--bl), 0.6)' }}
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div
        className="task-detail-modal fixed z-50 font-mono flex flex-col gap-5 overflow-y-auto scrollbar-hide
          bottom-0 left-0 right-0 max-h-[80vh] p-5
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:w-full md:max-w-[480px] md:max-h-[80vh]"
        style={{
          backgroundColor: 'hsl(var(--bh), var(--bs), var(--bl))',
          borderTop: '18px solid hsla(var(--h), var(--s), var(--l), 0.85)',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .task-detail-modal {
              border: 18px solid hsla(var(--h), var(--s), var(--l), 0.85) !important;
            }
          }
        `}</style>

        {/* Text input */}
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          className="w-full bg-transparent border-none outline-none font-mono font-extrabold text-lg"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
            paddingBottom: '8px',
          }}
          placeholder="task name..."
        />

        {/* Due date display */}
        {task.dueDate && (
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs font-bold"
              style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.6)' }}
            >
              due:
            </span>
            <span
              className="font-mono text-xs font-bold"
              style={{
                color: overdue ? 'hsl(0, 80%, 55%)' : 'hsl(var(--h), var(--s), var(--l))',
              }}
            >
              {getRelativeDateText(task.dueDate)}
            </span>
            <input
              type="date"
              value={task.dueDate}
              onChange={e => onUpdate(task.id, { dueDate: e.target.value || undefined })}
              className="font-mono text-xs bg-transparent border-none outline-none font-bold"
              style={{ color: 'hsl(var(--h), var(--s), var(--l))' }}
            />
          </div>
        )}

        {/* Priority */}
        <div className="flex flex-col gap-2">
          <span
            className="font-mono text-xs font-bold"
            style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.6)' }}
          >
            priority
          </span>
          <div className="flex gap-2">
            {([0, 1, 2] as const).map(p => (
              <FunctionButton
                key={p}
                size="sm"
                fullWidth={false}
                isActive={task.priority === p}
                overrideColor={
                  p === 1 ? 'hsl(45, 90%, 55%)'
                  : p === 2 ? 'hsl(0, 80%, 55%)'
                  : undefined
                }
                onClick={() => onUpdate(task.id, { priority: p })}
              >
                {p === 0 ? 'none' : p === 1 ? 'medium' : 'high'}
              </FunctionButton>
            ))}
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <span
              className="font-mono text-xs font-bold"
              style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.6)' }}
            >
              category
            </span>
            <div className="flex gap-2 flex-wrap">
              <FunctionButton
                size="sm"
                fullWidth={false}
                isActive={!task.categoryId}
                onClick={() => onUpdate(task.id, { categoryId: undefined })}
              >
                none
              </FunctionButton>
              {categories.map(c => (
                <FunctionButton
                  key={c.id}
                  size="sm"
                  fullWidth={false}
                  isActive={task.categoryId === c.id}
                  overrideColor={c.color}
                  onClick={() => onUpdate(task.id, { categoryId: c.id })}
                >
                  {c.name}
                </FunctionButton>
              ))}
            </div>
          </div>
        )}

        {/* Recurrence */}
        <div className="flex flex-col gap-2">
          <span
            className="font-mono text-xs font-bold"
            style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.6)' }}
          >
            repeat
          </span>
          <RecurrencePicker
            recurrence={task.recurrence}
            dueDate={task.dueDate}
            onChange={recurrence => onUpdate(task.id, { recurrence })}
          />
        </div>

        {/* Delete */}
        <div
          className="pt-3"
          style={{ borderTop: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)' }}
        >
          <FunctionButton
            size="sm"
            fullWidth={false}
            overrideColor="hsl(0, 80%, 55%)"
            onClick={handleDelete}
          >
            delete task
          </FunctionButton>
        </div>
      </div>
    </>
  )
}
