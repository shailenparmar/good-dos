import { useEffect, useRef } from 'react'
import { db } from '@shared/storage/db'
import type { Task } from '../types'

export function useAutoCleanup(tasks: Task[], activeTaskId: string | null) {
  const activeRef = useRef(activeTaskId)
  activeRef.current = activeTaskId

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const blanks = tasks.filter(
        t => t.text.trim() === '' && t.id !== activeRef.current && now - t.createdAt > 3000
      )
      for (const t of blanks) {
        db.tasks.delete(t.id)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [tasks])
}
