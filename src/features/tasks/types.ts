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

export interface TypeTag {
  id: string
  name: string
}

const TAG_COLORS = [
  'hsl(210, 70%, 55%)',  // blue
  'hsl(150, 60%, 45%)',  // green
  'hsl(270, 60%, 55%)',  // purple
  'hsl(180, 60%, 45%)',  // teal
  'hsl(320, 60%, 55%)',  // pink
  'hsl(240, 55%, 55%)',  // indigo
]

export function tagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length]
}
