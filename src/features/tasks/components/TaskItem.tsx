import { useState, useRef, useEffect, useCallback } from 'react'
import type { Task, TypeTag } from '../types'
import { PriorityIndicator } from './PriorityIndicator'
import { CategoryTag } from './CategoryTag'
import { DueDatePicker } from './DueDatePicker'
import { EncouragingMessage } from './EncouragingMessage'
import { ProgressBar } from './ProgressBar'
import { SubtaskList } from './SubtaskList'

interface TaskItemProps {
  task: Task
  subtasks: Task[]
  categories: TypeTag[]
  isSubtask?: boolean
  onToggle: (id: string) => void
  onUpdate: (id: string, changes: Partial<Task>) => void
  onDelete: (id: string) => void
  onCyclePriority: (id: string) => void
  onAddSubtask: (parentId: string) => Promise<string>
  getSubtasks: (parentId: string) => Task[]
  onIndent: (id: string) => void
  onUnindent: (id: string) => void
  onFocus: (id: string | null) => void
  onPlaySound: (isSubtask: boolean) => void
}

export function TaskItem({
  task,
  subtasks,
  categories,
  isSubtask = false,
  onToggle,
  onUpdate,
  onDelete,
  onCyclePriority,
  onAddSubtask,
  getSubtasks,
  onIndent,
  onUnindent,
  onFocus,
  onPlaySound,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [showMessage, setShowMessage] = useState(false)
  const [checkAnim, setCheckAnim] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync edit text when task text changes externally
  useEffect(() => {
    if (!isEditing) setEditText(task.text)
  }, [task.text, isEditing])

  // Auto-focus new blank tasks
  useEffect(() => {
    if (task.text === '' && inputRef.current) {
      setIsEditing(true)
      inputRef.current.focus()
      onFocus(task.id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback(() => {
    if (!task.completed) {
      setCheckAnim(true)
      setShowMessage(true)
      onPlaySound(isSubtask)
      setTimeout(() => setCheckAnim(false), 200)
    }
    onToggle(task.id)
  }, [task.completed, task.id, isSubtask, onToggle, onPlaySound])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditText(task.text)
      inputRef.current?.blur()
    } else if (e.key === 'Backspace' && editText === '') {
      e.preventDefault()
      onDelete(task.id)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        onUnindent(task.id)
      } else {
        onIndent(task.id)
      }
    }
  }, [editText, task.id, task.text, onDelete, onIndent, onUnindent])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    onFocus(null)
    if (editText !== task.text) {
      onUpdate(task.id, { text: editText })
    }
  }, [editText, task.id, task.text, onUpdate, onFocus])

  const completedCount = subtasks.filter(s => s.completed).length
  const category = categories.find(c => c.id === task.categoryId)

  return (
    <div>
      <div
        className={`flex items-center gap-1 group ${isSubtask ? 'pl-8' : ''}`}
        style={{ minHeight: isSubtask ? '40px' : '44px' }}
      >
        {/* Expand/collapse chevron for tasks with subtasks */}
        {!isSubtask && subtasks.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-11 flex items-center justify-center flex-shrink-0 font-mono text-xs"
            style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.4)' }}
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {!isSubtask && subtasks.length === 0 && <div className="w-6" />}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className="w-11 h-11 flex items-center justify-center flex-shrink-0"
        >
          <div
            className={`w-6 h-6 flex items-center justify-center ${checkAnim ? 'scale-105' : 'scale-100'}`}
            style={{
              border: `3px solid ${task.completed ? 'hsla(var(--h), var(--s), var(--l), 0.3)' : 'hsla(var(--h), var(--s), var(--l), 0.6)'}`,
              backgroundColor: task.completed ? 'hsla(var(--h), var(--s), var(--l), 0.15)' : 'transparent',
            }}
          >
            {task.completed && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7L6 10L11 4"
                  stroke="hsla(var(--h), var(--s), var(--l), 0.6)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="check-draw"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Task text */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onFocus={() => { setIsEditing(true); onFocus(task.id) }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none outline-none font-mono"
              style={{
                fontSize: isSubtask ? '14px' : '16px',
                color: task.completed
                  ? 'hsla(var(--h), var(--s), var(--l), 0.35)'
                  : 'hsl(var(--h), var(--s), var(--l))',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
              placeholder={isSubtask ? 'subtask...' : 'what needs doing?'}
            />
            <EncouragingMessage show={showMessage} onDone={() => setShowMessage(false)} />
          </div>
          {task.dueDate && !isEditing && (
            <DueDatePicker
              dueDate={task.dueDate}
              onChange={date => onUpdate(task.id, { dueDate: date })}
            />
          )}
        </div>

        {/* Category tag */}
        <CategoryTag
          category={category}
          categories={categories}
          onSelect={categoryId => onUpdate(task.id, { categoryId })}
        />

        {/* Date picker trigger (hidden, shows on hover/focus) */}
        {!task.dueDate && (
          <div className="opacity-0 group-hover:opacity-100">
            <DueDatePicker
              dueDate={task.dueDate}
              onChange={date => onUpdate(task.id, { dueDate: date })}
            />
          </div>
        )}

        {/* Priority */}
        <PriorityIndicator
          priority={task.priority}
          onClick={() => onCyclePriority(task.id)}
        />
      </div>

      {/* Progress bar for parent tasks */}
      {!isSubtask && subtasks.length > 0 && (
        <div className="pl-14 pr-11 pb-1">
          <ProgressBar completed={completedCount} total={subtasks.length} />
        </div>
      )}

      {/* Subtasks */}
      {!isSubtask && expanded && subtasks.length > 0 && (
        <SubtaskList
          parentId={task.id}
          subtasks={subtasks}
          categories={categories}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCyclePriority={onCyclePriority}
          onAddSubtask={onAddSubtask}
          getSubtasks={getSubtasks}
          onIndent={onIndent}
          onUnindent={onUnindent}
          onFocus={onFocus}
          onPlaySound={onPlaySound}
        />
      )}
    </div>
  )
}
