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
  'hsl(28,  85%, 55%)',  // orange
  'hsl(85,  65%, 42%)',  // lime
  'hsl(175, 65%, 43%)',  // teal
  'hsl(215, 75%, 58%)',  // blue
  'hsl(270, 65%, 58%)',  // purple
  'hsl(325, 65%, 55%)',  // rose
]

export function tagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length]
}
