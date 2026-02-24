import type { TypeTag } from '../types'

interface CategoryTagProps {
  category: TypeTag | undefined
  categories: TypeTag[]
  categoryColor?: string
  onSelect: (categoryId: string | undefined) => void
}

export function CategoryTag({ category, categories, categoryColor, onSelect }: CategoryTagProps) {
  if (!category && categories.length === 0) return null

  return (
    <select
      value={category?.id ?? ''}
      onChange={e => onSelect(e.target.value || undefined)}
      onClick={e => e.stopPropagation()}
      className="text-xs font-mono border-none outline-none bg-transparent flex-shrink-0"
      style={{
        padding: 'var(--sp-xs) var(--sp-sm)',
        color: categoryColor ?? 'hsla(var(--h), var(--s), var(--l), 0.5)',
        backgroundColor: 'transparent',
      }}
    >
      <option value="">—</option>
      {categories.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}
