export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  endDate?: string
}

export interface Task {
  id: string
  text: string
  completed: boolean
  completedAt?: number
  priority: 0 | 1 | 2
  categoryId?: string
  dueDate?: string
  parentId: string
  recurrence?: RecurrenceRule
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  name: string
  color: string
}
