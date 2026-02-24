import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@shared/storage/db'
import { ThemePicker } from '@features/theme/components/ThemePicker'
import { FunctionButton } from '@shared/components/FunctionButton'
import { APP_VERSION } from '@shared/version'
import { lsGetNumber, lsSet } from '@shared/storage'
import type { Category } from '@features/tasks/types'

interface SettingsPanelProps {
  isOpen: boolean
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'home', name: 'home', color: 'hsl(140, 55%, 45%)' },
  { id: 'school', name: 'school', color: 'hsl(210, 60%, 55%)' },
  { id: 'personal', name: 'personal', color: 'hsl(30, 80%, 55%)' },
]

export function SettingsPanel({ isOpen }: SettingsPanelProps) {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? []
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6b8f71')
  const [weekStartsOn, setWeekStartsOnState] = useState(() => lsGetNumber('weekStartsOn', 1))

  const setWeekStartsOn = (val: number) => {
    setWeekStartsOnState(val)
    lsSet('weekStartsOn', String(val))
  }

  const initDefaults = async () => {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await db.categories.get(cat.id)
      if (!existing) await db.categories.add(cat)
    }
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    await db.categories.add({
      id: generateId(),
      name: newCatName.trim().toLowerCase(),
      color: newCatColor,
    })
    setNewCatName('')
  }

  const deleteCategory = async (id: string) => {
    await db.categories.delete(id)
    const tasksWithCat = await db.tasks.where('categoryId').equals(id).toArray()
    for (const t of tasksWithCat) {
      await db.tasks.update(t.id, { categoryId: undefined })
    }
  }

  return (
    <div
      className="flex-shrink-0 h-full overflow-hidden"
      style={{
        width: isOpen ? 'min(420px, 50vw)' : '0px',
        borderLeft: isOpen ? '3px solid hsl(var(--h), var(--s), var(--l))' : '0px solid transparent',
      }}
    >
      <div
        className="h-full flex flex-col p-4 overflow-y-auto scrollbar-hide"
        style={{
          width: 'min(420px, 50vw)',
          backgroundColor: 'hsl(var(--bh), var(--bs), var(--bl))',
        }}
      >
        {/* Color picker */}
        <section className="mb-5">
          <ThemePicker />
        </section>

        {/* Divider */}
        <div className="h-px w-full mb-5" style={{ backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }} />

        {/* Categories */}
        <section className="mb-5">
          {categories.length === 0 && (
            <div className="mb-3">
              <FunctionButton onClick={initDefaults} size="sm">
                add defaults
              </FunctionButton>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => deleteCategory(cat.id)}
                className="font-mono font-black px-4 py-2 active:scale-90 uppercase"
                style={{
                  fontSize: 'clamp(11px, 1.3vw, 14px)',
                  color: cat.color,
                  border: `3px solid ${cat.color}`,
                  backgroundColor: 'transparent',
                }}
                title={`remove ${cat.name}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newCatColor}
              onChange={e => setNewCatColor(e.target.value)}
              className="w-8 h-8 cursor-pointer border-none bg-transparent"
            />
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="new category"
              className="flex-1 font-mono font-black bg-transparent border-none outline-none"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.15)',
                paddingBottom: '4px',
              }}
            />
            <button
              onClick={addCategory}
              className="font-mono font-black px-3 py-1"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
              }}
            >
              +
            </button>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-full mb-5" style={{ backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }} />

        {/* Week start */}
        <section className="mb-5">
          <div className="flex gap-2">
            <FunctionButton
              size="sm"
              fullWidth={false}
              isActive={weekStartsOn === 1}
              onClick={() => setWeekStartsOn(1)}
            >
              mon
            </FunctionButton>
            <FunctionButton
              size="sm"
              fullWidth={false}
              isActive={weekStartsOn === 0}
              onClick={() => setWeekStartsOn(0)}
            >
              sun
            </FunctionButton>
          </div>
        </section>

        {/* Version — bottom */}
        <section className="mt-auto pt-4 flex-shrink-0">
          <p
            className="font-mono font-black"
            style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.2)' }}
          >
            v{APP_VERSION}
          </p>
        </section>
      </div>
    </div>
  )
}
