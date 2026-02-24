import type { Category } from '../types'

interface CategoryTagProps {
  category: Category | undefined
  categories: Category[]
  onSelect: (categoryId: string | undefined) => void
}

export function CategoryTag({ category, categories, onSelect }: CategoryTagProps) {
  if (!category && categories.length === 0) return null

  return (
    <select
      value={category?.id ?? ''}
      onChange={e => onSelect(e.target.value || undefined)}
      onClick={e => e.stopPropagation()}
      className="text-xs font-mono px-2 py-0.5 border-none outline-none bg-transparent flex-shrink-0"
      style={{
        color: category?.color ?? 'hsla(var(--h), var(--s), var(--l), 0.5)',
        backgroundColor: category ? category.color + '20' : 'transparent',
      }}
    >
      <option value="">—</option>
      {categories.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}
