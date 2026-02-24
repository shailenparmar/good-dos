import { useEffect } from 'react'
import { db } from '@shared/storage/db'
import type { Task } from '../types'
import { getNextOccurrence, toDateString } from '@shared/utils/date'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useRecurring(tasks: Task[]) {
  useEffect(() => {
    const completedRecurring = tasks.filter(t => t.completed && t.recurrence)

    for (const task of completedRecurring) {
      if (!task.recurrence || !task.dueDate) continue

      // Check if a next instance already exists
      const hasNext = tasks.some(
        t => !t.completed && t.text === task.text && t.parentId === task.parentId
      )
      if (hasNext) continue

      const nextDate = getNextOccurrence(
        task.recurrence.frequency,
        task.recurrence.interval,
        new Date(task.dueDate + 'T00:00:00'),
        task.recurrence.daysOfWeek,
        task.recurrence.dayOfMonth
      )

      // Check end date
      if (task.recurrence.endDate && nextDate > new Date(task.recurrence.endDate + 'T00:00:00')) {
        continue
      }

      const now = Date.now()
      db.tasks.add({
        id: generateId(),
        text: task.text,
        completed: false,
        priority: task.priority,
        categoryId: task.categoryId,
        dueDate: toDateString(nextDate),
        parentId: task.parentId,
        recurrence: task.recurrence,
        sortOrder: task.sortOrder,
        createdAt: now,
        updatedAt: now,
      })
    }
  }, [tasks])
}
