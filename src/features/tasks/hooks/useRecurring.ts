import { useEffect, useRef } from 'react'
import { db } from '@shared/storage/db'
import type { Task } from '../types'
import { getNextOccurrence, toDateString } from '@shared/utils/date'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// How far ahead to pre-populate recurring tasks (days)
const HORIZON_DAYS = 60

export function useRecurring(tasks: Task[]) {
  const generating = useRef(false)

  useEffect(() => {
    if (generating.current) return
    const horizon = new Date()
    horizon.setHours(0, 0, 0, 0)
    horizon.setDate(horizon.getDate() + HORIZON_DAYS)

    // Find original recurring tasks (top-level with recurrence)
    const originals = tasks.filter(t => t.recurrence && t.dueDate && t.parentId === '')
    if (originals.length === 0) return

    const toAdd: Omit<Task, 'id'>[] = []

    for (const original of originals) {
      // Children = generated instances of this recurring task
      const children = tasks.filter(t => t.parentId === original.id && t.dueDate)
      const existingDates = new Set([original.dueDate!, ...children.map(t => t.dueDate!)])

      const recurrence = original.recurrence!

      // Always generate from the original date — existingDates prevents duplicates.
      // This ensures newly added days (e.g. toggling Mon onto a Wed recurrence)
      // get populated for all dates, not just after the latest existing child.
      let cursor = new Date(original.dueDate! + 'T00:00:00')
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
        if (recurrence.endDate && next > new Date(recurrence.endDate + 'T00:00:00')) break

        const dateStr = toDateString(next)
        if (!existingDates.has(dateStr)) {
          existingDates.add(dateStr)
          const now = Date.now()
          toAdd.push({
            text: original.text,
            completed: false,
            priority: original.priority,
            categoryId: original.categoryId,
            dueDate: dateStr,
            parentId: original.id,
            sortOrder: original.sortOrder,
            createdAt: now,
            updatedAt: now,
          })
        }

        cursor = next
      }
    }

    if (toAdd.length > 0) {
      generating.current = true
      db.tasks.bulkAdd(toAdd.map(t => ({ ...t, id: generateId() }))).finally(() => {
        generating.current = false
      })
    }
  }, [tasks])
}
