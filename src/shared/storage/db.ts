import Dexie, { type Table } from 'dexie'
import type { Task, TypeTag } from '@features/tasks/types'

class TodoDB extends Dexie {
  tasks!: Table<Task>
  typetags!: Table<TypeTag>

  constructor() {
    super('todo-db')
    this.version(1).stores({
      tasks: 'id, parentId, categoryId, dueDate, completed, sortOrder, createdAt',
      categories: 'id, name',
    })
    this.version(2).stores({
      tasks: 'id, parentId, categoryId, dueDate, completed, sortOrder, createdAt',
      typetags: 'id, name',
      categories: null,
    }).upgrade(tx => {
      return tx.table('categories').toArray().then((cats: any[]) => {
        return tx.table('typetags').bulkAdd(cats.map(c => ({
          id: c.id,
          name: c.name,
        })))
      })
    })
  }
}

export const db = new TodoDB()
