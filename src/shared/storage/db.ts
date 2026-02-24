import Dexie, { type Table } from 'dexie'
import type { Task, Category } from '@features/tasks/types'

class TodoDB extends Dexie {
  tasks!: Table<Task>
  categories!: Table<Category>

  constructor() {
    super('todo-db')
    this.version(1).stores({
      tasks: 'id, parentId, categoryId, dueDate, completed, sortOrder, createdAt',
      categories: 'id, name',
    })
  }
}

export const db = new TodoDB()
