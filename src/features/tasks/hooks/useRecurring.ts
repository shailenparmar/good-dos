import { useEffect } from 'react'
import { db } from '@shared/storage/db'
import type { Task } from '../types'
import { getNextOccurrence, toDateString } from '@shared/utils/date'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// How far ahead to pre-populate recurring tasks (days)
const HORIZON_DAYS = 60

export function useRecurring(tasks: Task[]) {
  useEffect(() => {
    const horizon = new Date()
    horizon.setHours(0, 0, 0, 0)
    horizon.setDate(horizon.getDate() + HORIZON_DAYS)

    // Group tasks by recurrence "series" — same text + parentId
    // Find all recurring tasks (completed or not)
    const recurringTasks = tasks.filter(t => t.recurrence && t.dueDate)
    if (recurringTasks.length === 0) return

    // Group by series key (text + parentId)
    const seriesMap = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.dueDate) continue
      const key = `${t.text}\0${t.parentId}`
      const list = seriesMap.get(key) ?? []
      list.push(t)
      seriesMap.set(key, list)
    }

    // For each series that has recurrence, find the latest due date and fill forward
    const toAdd: Omit<Task, 'id'>[] = []
    const seen = new Set<string>() // track series we've already processed

    for (const task of recurringTasks) {
      const key = `${task.text}\0${task.parentId}`
      if (seen.has(key)) continue
      seen.add(key)

      const series = seriesMap.get(key) ?? []
      const existingDates = new Set(series.map(t => t.dueDate!))

      // Find the latest date in this series
      const latestDate = series.reduce((max, t) => {
        return t.dueDate! > max ? t.dueDate! : max
      }, series[0].dueDate!)

      // Use recurrence from any task in the series that has it
      const recurrence = task.recurrence!

      // Generate forward from the latest date until horizon
      let cursor = new Date(latestDate + 'T00:00:00')
      let safety = 0
      while (safety++ < 500) {
        const next = getNextOccurrence(
          recurrence.frequency,
          recurrence.interval,
          cursor,
          recurrence.daysOfWeek,
          recurrence.dayOfMonth
        )

        if (next > horizon) break

        // Check end date
        if (recurrence.endDate && next > new Date(recurrence.endDate + 'T00:00:00')) break

        const dateStr = toDateString(next)
        if (!existingDates.has(dateStr)) {
          existingDates.add(dateStr)
          const now = Date.now()
          toAdd.push({
            text: task.text,
            completed: false,
            priority: task.priority,
            categoryId: task.categoryId,
            dueDate: dateStr,
            parentId: task.parentId,
            recurrence,
            sortOrder: task.sortOrder,
            createdAt: now,
            updatedAt: now,
          })
        }

        cursor = next
      }
    }

    if (toAdd.length > 0) {
      db.tasks.bulkAdd(toAdd.map(t => ({ ...t, id: generateId() })))
    }
  }, [tasks])
}
