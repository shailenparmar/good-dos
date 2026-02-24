import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@shared/storage/db'
import type { Task } from '../types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useTasks() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? []

  const topLevelTasks = tasks
    .filter(t => t.parentId === '')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const getSubtasks = (parentId: string): Task[] =>
    tasks
      .filter(t => t.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  const getTasksForDate = (dateStr: string): Task[] =>
    tasks
      .filter(t => t.parentId === '' && t.dueDate === dateStr)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  const getUnscheduledTasks = (): Task[] =>
    tasks
      .filter(t => t.parentId === '' && !t.dueDate)
      .sort((a, b) => a.createdAt - b.createdAt)

  const addTask = async (text: string, parentId: string = '', dueDate?: string): Promise<string> => {
    const id = generateId()
    const siblings = tasks.filter(t => t.parentId === parentId)
    const maxSort = siblings.reduce((max, t) => Math.max(max, t.sortOrder), 0)
    const now = Date.now()
    await db.tasks.add({
      id,
      text,
      completed: false,
      priority: 0,
      parentId,
      dueDate,
      sortOrder: maxSort + 1,
      createdAt: now,
      updatedAt: now,
    })
    return id
  }

  const updateTask = async (id: string, changes: Partial<Task>) => {
    await db.tasks.update(id, { ...changes, updatedAt: Date.now() })
  }

  const deleteTask = async (id: string) => {
    // Delete subtasks too
    const subtasks = tasks.filter(t => t.parentId === id)
    for (const st of subtasks) {
      await db.tasks.delete(st.id)
    }
    await db.tasks.delete(id)
  }

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const completed = !task.completed
    await db.tasks.update(id, {
      completed,
      completedAt: completed ? Date.now() : undefined,
      updatedAt: Date.now(),
    })
  }

  const cyclePriority = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const next = ((task.priority + 1) % 3) as 0 | 1 | 2
    await db.tasks.update(id, { priority: next, updatedAt: Date.now() })
  }

  const indentTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || task.parentId !== '') return

    // Find the task directly above this one in the sorted list
    const idx = topLevelTasks.findIndex(t => t.id === id)
    if (idx <= 0) return
    const newParent = topLevelTasks[idx - 1]

    const siblings = tasks.filter(t => t.parentId === newParent.id)
    const maxSort = siblings.reduce((max, t) => Math.max(max, t.sortOrder), 0)

    await db.tasks.update(id, {
      parentId: newParent.id,
      sortOrder: maxSort + 1,
      updatedAt: Date.now(),
    })
  }

  const unindentTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || task.parentId === '') return

    await db.tasks.update(id, {
      parentId: '',
      sortOrder: Date.now(),
      updatedAt: Date.now(),
    })
  }

  const moveTaskToDate = async (id: string, newDate: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    if (task.dueDate === newDate) return
    await db.tasks.update(id, { dueDate: newDate, updatedAt: Date.now() })
  }

  return {
    tasks,
    topLevelTasks,
    getSubtasks,
    getTasksForDate,
    getUnscheduledTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    cyclePriority,
    indentTask,
    unindentTask,
    moveTaskToDate,
  }
}
