import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@shared/storage/db'
import { useTasks } from '../hooks/useTasks'
import { useRecurring } from '../hooks/useRecurring'
import { useAutoCleanup } from '../hooks/useAutoCleanup'
import { useTaskSound } from '../hooks/useTaskSound'
import { tagColor } from '../types'
import type { Task } from '../types'
import { formatCalendarMonth, getMonthGrid, getWeekDays, toDateString, getDateLabel } from '@shared/utils/date'
import { getRandomMessage } from '@shared/utils/messages'
import { lsGetNumber } from '@shared/storage'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
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
    moveTaskToDate,
    deleteTask,
    removeRecurrence,
  } = useTasks()

  const typetags = useLiveQuery(() => db.typetags.toArray()) ?? []
  const { playComplete } = useTaskSound()

  useAutoCleanup(tasks, null)
  useRecurring(tasks)

  const [viewMode, setViewMode] = useState<'week' | 'month'>('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [prefillDate, setPrefillDate] = useState<string | null>(null)
  const [dateFilterDates, setDateFilterDates] = useState<string[]>([])
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)
  const [lockedDate, setLockedDate] = useState<string | null>(null)
  const [inputResetKey, setInputResetKey] = useState(0)
  const [colorsOpen, setColorsOpen] = useState(false)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [cursorDate, setCursorDate] = useState<string | null>(null)

  // Refs for ESC handler (avoid stale closures)
  const selectedTaskRef = useRef(selectedTask)
  const settingsOpenRef = useRef(settingsOpen)
  const colorsOpenRef = useRef(colorsOpen)

  useEffect(() => { selectedTaskRef.current = selectedTask }, [selectedTask])
  useEffect(() => { settingsOpenRef.current = settingsOpen }, [settingsOpen])
  useEffect(() => { colorsOpenRef.current = colorsOpen }, [colorsOpen])

  // ESC handler: progressive unwind — colors → settings → edit panel → snap to today
  // The input bar handles its own Esc unwinding (priority → name → date → blur)
  // and only lets Esc through once it's fully reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Printable key outside the edit panel → close panel so typing goes to the typer
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (!target.closest?.('[data-edit-panel]')) {
          setSelectedTask(null)
        }
        return
      }

      if (e.key !== 'Escape') return
      if (e.repeat) return

      // Let the input bar handle its own unwinding first
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

      // Nothing open — snap view back to today, hide cursor
      setMonthOffset(0)
      setCursorDate(null)
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

  // Week days for WeekView
  const weekStartsOn = lsGetNumber('weekStartsOn', 1) as 0 | 1
  const weekDays = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    base.setDate(base.getDate() + monthOffset * 7)
    return getWeekDays(base, weekStartsOn)
  }, [monthOffset, weekStartsOn])

  // Week date options for TaskInputBar tab-cycling — today-first, then future, then past
  const weekDateOptions = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const todayMs = now.getTime()
    const all = weekDays.map(d => ({ value: toDateString(d), label: getDateLabel(d), ms: d.getTime() }))
    const future = all.filter(d => d.ms >= todayMs).sort((a, b) => a.ms - b.ms)
    const past = all.filter(d => d.ms < todayMs).sort((a, b) => a.ms - b.ms)
    return [...future, ...past]
  }, [weekDays])

  const handlePrev = useCallback(() => setMonthOffset(m => m - 1), [])
  const handleNext = useCallback(() => setMonthOffset(m => m + 1), [])

  const handleCursorChange = useCallback((dateStr: string) => {
    setCursorDate(dateStr)
    // If cursor moves to a different month, navigate there
    const d = new Date(dateStr + 'T00:00:00')
    const cursorYear = d.getFullYear()
    const cursorMonth = d.getMonth()
    if (cursorYear !== monthYear || cursorMonth !== monthMonth) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const diffMonths = (cursorYear - now.getFullYear()) * 12 + (cursorMonth - now.getMonth())
      setMonthOffset(diffMonths)
    }
  }, [monthYear, monthMonth])
  const handleToday = useCallback(() => setMonthOffset(0), [])

  const handleViewChange = useCallback((mode: 'week' | 'month') => {
    setViewMode(mode)
    setMonthOffset(0)
  }, [])

  const handleDayClick = useCallback((dateStr: string) => {
    if (dateStr === lockedDate) {
      // Unpopulate — clear immediately
      setLockedDate(null)
      setInputResetKey(k => k + 1)
      setPrefillDate(null)
    } else {
      // Populate — highlight immediately, then prefill input
      setLockedDate(dateStr)
      setPrefillDate(dateStr)
    }
  }, [lockedDate])

const handleCreateTask = useCallback(async (name: string, dueDate: string, priority: 0 | 1 | 2) => {
  const id = await addTask(name, '', dueDate)
  if (priority !== 0) {
    await updateTask(id, { priority })
  }
  // Auto-open the TaskEditPanel for the newly created task
  const newTask = await db.tasks.get(id)
  if (newTask) {
    setSelectedTask(newTask)
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

  const flashSuccess = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setFlashMessage(getRandomMessage())
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 1500)
  }, [])

  const handleToggleComplete = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task && !task.completed) {
      flashSuccess()
    } else {
      // Uncompleting — dismiss any celebration
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      setFlashMessage(null)
    }
    toggleComplete(id)
  }, [tasks, toggleComplete, flashSuccess])


  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(prev => prev?.id === task.id ? null : task)
  }, [])

  const handleToggleColors = useCallback(() => {
    setColorsOpen(o => !o)
  }, [])

  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (let i = 0; i < typetags.length; i++) {
      map[typetags[i].id] = tagColor(i)
    }
    return map
  }, [typetags])

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
        monthDates={viewMode === 'week' ? weekDateOptions : monthDates}
        monthTitle={monthTitle}
        onSettings={handleToggleColors}
        colorsOpen={colorsOpen}
        onPrev={handlePrev}
        onNext={handleNext}
        viewMode={viewMode}
        onViewChange={handleViewChange}
        onToday={handleToday}
        flashMessage={flashMessage}
        onUserType={() => setSelectedTask(null)}
        onEscape={() => {
          if (colorsOpen) { setColorsOpen(false); return }
          if (settingsOpen) { onCloseSettings(); return }
          if (selectedTask) { setSelectedTask(null); return }
          setMonthOffset(0)
          setCursorDate(toDateString(new Date()))
        }}
      />

      {/* Task edit panel — inline, under input bar */}
      {currentSelectedTask && (
        <TaskEditPanel
          task={currentSelectedTask}
          typetags={typetags}
          onUpdate={updateTask}
          onDelete={async (id) => { await deleteTask(id); setSelectedTask(null) }}
          onRemoveRecurrence={removeRecurrence}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Inline color picker — 4 equal rectangles */}
      {colorsOpen && (
        <div
          className="flex-shrink-0 grid"
          style={{
            gap: 'var(--sp-sm)',
            padding: '0 var(--sp-md) var(--sp-md) var(--sp-md)',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            height: 'calc(clamp(22px, 3vw, 36px) + var(--sp-md-r) * 2 + 8px + 24px)',
            borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.1)',
          }}
        >
          <ColorPicker type="text" part="sl" />
          <ColorPicker type="text" part="hue" />
          <ColorPicker type="background" part="hue" />
          <ColorPicker type="background" part="sl" />
        </div>
      )}

      {viewMode === 'month' ? (
        <MonthView
          year={monthYear}
          month={monthMonth}
          getTasksForDate={getTasksForDate}
          onToggle={handleToggleComplete}
          onCyclePriority={cyclePriority}
          onTaskClick={handleTaskClick}
          onDayClick={handleDayClick}
          onPlaySound={handlePlaySound}
          highlightedDates={highlightedDatesSet}
          activeHighlight={highlightedDate}
          lockedDate={lockedDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onMoveTask={moveTaskToDate}
          categoryColorMap={categoryColorMap}
          selectedTaskId={selectedTask?.id ?? null}
          cursorDate={cursorDate}
          onCursorChange={handleCursorChange}
        />
      ) : (
        <WeekView
          days={weekDays}
          getTasksForDate={getTasksForDate}
          onToggle={handleToggleComplete}
          onCyclePriority={cyclePriority}
          onTaskClick={handleTaskClick}
          onDayEmptyClick={handleDayClick}
          onPlaySound={handlePlaySound}
          highlightedDates={highlightedDatesSet}
          activeHighlight={highlightedDate}
          lockedDate={lockedDate}
          onMoveTask={moveTaskToDate}
          categoryColorMap={categoryColorMap}
          selectedTaskId={selectedTask?.id ?? null}
        />
      )}
    </div>
  )
}
