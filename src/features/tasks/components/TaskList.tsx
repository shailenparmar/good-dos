import { useState, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@shared/storage/db'
import { useTasks } from '../hooks/useTasks'
import { useTaskSound } from '../hooks/useTaskSound'
import { useAutoCleanup } from '../hooks/useAutoCleanup'
import { useRecurring } from '../hooks/useRecurring'
import { TaskItem } from './TaskItem'
import { TaskInput } from './TaskInput'

export function TaskList() {
  const {
    tasks,
    topLevelTasks,
    getSubtasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    cyclePriority,
    indentTask,
    unindentTask,
  } = useTasks()

  const categories = useLiveQuery(() => db.categories.toArray()) ?? []
  const { playComplete } = useTaskSound()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useAutoCleanup(tasks, activeTaskId)
  useRecurring(tasks)

  const handleAdd = useCallback(async (text: string) => {
    await addTask(text)
  }, [addTask])

  const handlePlaySound = useCallback((isSubtask: boolean) => {
    playComplete(isSubtask)
  }, [playComplete])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {topLevelTasks.length === 0 && (
          <div
            className="flex items-center justify-center py-16 font-mono text-sm"
            style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.3)' }}
          >
            no tasks yet
          </div>
        )}
        {topLevelTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            subtasks={getSubtasks(task.id)}
            categories={categories}
            onToggle={toggleComplete}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onCyclePriority={cyclePriority}
            onAddSubtask={addTask}
            getSubtasks={getSubtasks}
            onIndent={indentTask}
            onUnindent={unindentTask}
            onFocus={setActiveTaskId}
            onPlaySound={handlePlaySound}
          />
        ))}
      </div>
      <TaskInput onAdd={handleAdd} inputRef={inputRef} />
    </div>
  )
}
