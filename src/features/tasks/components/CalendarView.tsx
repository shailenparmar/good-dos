import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@shared/storage/db'
import { useTasks } from '../hooks/useTasks'
import { useRecurring } from '../hooks/useRecurring'
import { useAutoCleanup } from '../hooks/useAutoCleanup'
import { useTaskSound } from '../hooks/useTaskSound'
import type { Task } from '../types'
import { formatCalendarMonth, getMonthGrid, toDateString, getDateLabel } from '@shared/utils/date'
import { MonthView } from './MonthView'
import { TaskEditPanel } from './TaskEditPanel'
import { TaskInputBar } from './TaskInputBar'
import { ColorPicker } from '@features/theme/components/ColorPicker'

interface CalendarViewProps {
  settingsOpen: boolean
  onCloseSettings: () => void
}

export function CalendarView({ settingsOpen, onCloseSettings }: CalendarViewProps) {
  const {
    tasks,
    getTasksForDate,
    addTask,
    updateTask,
    toggleComplete,
    cyclePriority,
  } = useTasks()

  const categories = useLiveQuery(() => db.categories.toArray()) ?? []
  const { playComplete } = useTaskSound()

  useAutoCleanup(tasks, null)
  useRecurring(tasks)

  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [prefillDate, setPrefillDate] = useState<string | null>(null)
  const [dateFilterDates, setDateFilterDates] = useState<string[]>([])
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)
  const [lockedDate, setLockedDate] = useState<string | null>(null)
  const [inputResetKey, setInputResetKey] = useState(0)
  const [colorsOpen, setColorsOpen] = useState(false)

  // Refs for ESC handler (avoid stale closures)
  const selectedTaskRef = useRef(selectedTask)
  const settingsOpenRef = useRef(settingsOpen)
  const colorsOpenRef = useRef(colorsOpen)

  useEffect(() => { selectedTaskRef.current = selectedTask }, [selectedTask])
  useEffect(() => { settingsOpenRef.current = settingsOpen }, [settingsOpen])
  useEffect(() => { colorsOpenRef.current = colorsOpen }, [colorsOpen])

  // ESC handler: unwind colors → settings → modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (e.repeat) return

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      e.preventDefault()

      if (colorsOpenRef.current) {
        setColorsOpen(false)
        return
      }

      if (settingsOpenRef.current) {
        onCloseSettings()
        return
      }

      if (selectedTaskRef.current) {
        setSelectedTask(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCloseSettings])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthBase = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthYear = monthBase.getFullYear()
  const monthMonth = monthBase.getMonth()
  const monthTitle = formatCalendarMonth(monthYear, monthMonth)

  // Generate month date options for TaskInputBar — no past dates, sorted closest-first
  const monthDates = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const todayMs = now.getTime()
    const grid = getMonthGrid(monthYear, monthMonth)
    const options: { value: string; label: string; ms: number }[] = []
    for (const week of grid) {
      for (const date of week) {
        if (!date) continue
        const ms = date.getTime()
        if (ms < todayMs) continue // skip past dates
        options.push({ value: toDateString(date), label: getDateLabel(date), ms })
      }
    }
    options.sort((a, b) => a.ms - b.ms)
    return options
  }, [monthYear, monthMonth])

  // Derived highlight data for MonthView
  const highlightedDatesSet = useMemo(() => new Set(dateFilterDates), [dateFilterDates])

  const handlePrev = useCallback(() => setMonthOffset(m => m - 1), [])
  const handleNext = useCallback(() => setMonthOffset(m => m + 1), [])

  const handleDayClick = useCallback((dateStr: string) => {
    if (dateStr === lockedDate) {
      setInputResetKey(k => k + 1)
      setPrefillDate(null)
    } else {
      setPrefillDate(dateStr)
    }
  }, [lockedDate])

  const handleCreateTask = useCallback(async (name: string, dueDate: string, priority: 0 | 1 | 2) => {
    const id = await addTask(name, '', dueDate)
    if (priority !== 0) {
      await updateTask(id, { priority })
    }
  }, [addTask, updateTask])

  const handleClearPrefill = useCallback(() => {
    setPrefillDate(null)
  }, [])

  const handleDateFilterChange = useCallback((filteredDates: string[], highlightedDate: string | null) => {
    setDateFilterDates(filteredDates)
    setHighlightedDate(highlightedDate)
  }, [])

  const handleLockedDateChange = useCallback((dateStr: string | null) => {
    setLockedDate(dateStr)
  }, [])

  const handlePlaySound = useCallback((isSubtask: boolean, priority: number = 0) => {
    playComplete(isSubtask, priority)
  }, [playComplete])

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
  }, [])

  const handleToggleColors = useCallback(() => {
    setColorsOpen(o => !o)
  }, [])

  const currentSelectedTask = selectedTask
    ? tasks.find(t => t.id === selectedTask.id) ?? null
    : null

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <TaskInputBar
        onCreateTask={handleCreateTask}
        prefillDate={prefillDate}
        onClearPrefill={handleClearPrefill}
        onDateFilterChange={handleDateFilterChange}
        onLockedDateChange={handleLockedDateChange}
        resetKey={inputResetKey}
        hideDatePopup
        monthDates={monthDates}
        monthTitle={monthTitle}
        onSettings={handleToggleColors}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Task edit panel — inline, under input bar */}
      {currentSelectedTask && (
        <TaskEditPanel
          task={currentSelectedTask}
          categories={categories}
          onUpdate={updateTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Inline color picker — 4 equal rectangles */}
      {colorsOpen && (
        <div
          className="flex-shrink-0 grid gap-2 px-3 pt-0 pb-3"
          style={{
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            height: 'calc(clamp(22px, 3vw, 36px) + clamp(6px, 1vw, 12px) * 2 + 8px + 24px)',
            borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.1)',
          }}
        >
          <ColorPicker type="text" part="sl" />
          <ColorPicker type="text" part="hue" />
          <ColorPicker type="background" part="hue" />
          <ColorPicker type="background" part="sl" />
        </div>
      )}

      <MonthView
        year={monthYear}
        month={monthMonth}
        getTasksForDate={getTasksForDate}
        onToggle={toggleComplete}
        onCyclePriority={cyclePriority}
        onTaskClick={handleTaskClick}
        onDayClick={handleDayClick}
        onPlaySound={handlePlaySound}
        highlightedDates={highlightedDatesSet}
        activeHighlight={highlightedDate}
        lockedDate={lockedDate}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}
