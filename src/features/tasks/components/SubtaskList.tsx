import type { Task, TypeTag } from '../types'
import { TaskItem } from './TaskItem'

interface SubtaskListProps {
  parentId: string
  subtasks: Task[]
  categories: TypeTag[]
  onToggle: (id: string) => void
  onUpdate: (id: string, changes: Partial<Task>) => void
  onDelete: (id: string) => void
  onCyclePriority: (id: string) => void
  onAddSubtask: (parentId: string) => Promise<string>
  getSubtasks: (parentId: string) => Task[]
  onIndent: (id: string) => void
  onUnindent: (id: string) => void
  onFocus: (id: string | null) => void
  onPlaySound: (isSubtask: boolean) => void
}

export function SubtaskList({
  parentId: _parentId,
  subtasks,
  categories,
  onToggle,
  onUpdate,
  onDelete,
  onCyclePriority,
  onAddSubtask,
  getSubtasks,
  onIndent,
  onUnindent,
  onFocus,
  onPlaySound,
}: SubtaskListProps) {
  void _parentId
  return (
    <div>
      {subtasks.map(subtask => (
        <TaskItem
          key={subtask.id}
          task={subtask}
          subtasks={[]}
          categories={categories}
          isSubtask
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCyclePriority={onCyclePriority}
          onAddSubtask={onAddSubtask}
          getSubtasks={getSubtasks}
          onIndent={onIndent}
          onUnindent={onUnindent}
          onFocus={onFocus}
          onPlaySound={onPlaySound}
        />
      ))}
    </div>
  )
}
