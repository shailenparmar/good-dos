import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@shared/storage/db'
import { ThemePicker } from '@features/theme/components/ThemePicker'
import { FunctionButton } from '@shared/components/FunctionButton'
import { APP_VERSION } from '@shared/version'
import { lsGetNumber, lsSet } from '@shared/storage'
import { tagColor } from '@features/tasks/types'
import type { TypeTag } from '@features/tasks/types'

interface SettingsPanelProps {
  isOpen: boolean
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const DEFAULT_TYPETAGS: TypeTag[] = [
  { id: 'work', name: 'work' },
  { id: 'social', name: 'social' },
]

export function SettingsPanel({ isOpen }: SettingsPanelProps) {
  const typetags = useLiveQuery(() => db.typetags.toArray()) ?? []
  const [newTagName, setNewTagName] = useState('')
  const [weekStartsOn, setWeekStartsOnState] = useState(() => lsGetNumber('weekStartsOn', 1))

  const setWeekStartsOn = (val: number) => {
    setWeekStartsOnState(val)
    lsSet('weekStartsOn', String(val))
  }

  const initDefaults = async () => {
    for (const tag of DEFAULT_TYPETAGS) {
      const existing = await db.typetags.get(tag.id)
      if (!existing) await db.typetags.add(tag)
    }
  }

  const addTypetag = async () => {
    if (!newTagName.trim()) return
    await db.typetags.add({
      id: generateId(),
      name: newTagName.trim().toLowerCase(),
    })
    setNewTagName('')
  }

  const deleteTypetag = async (id: string) => {
    await db.typetags.delete(id)
    const tasksWithTag = await db.tasks.where('categoryId').equals(id).toArray()
    for (const t of tasksWithTag) {
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
        className="h-full flex flex-col overflow-y-auto scrollbar-hide"
        style={{
          padding: 'var(--sp-lg)',
          width: 'min(420px, 50vw)',
          backgroundColor: 'hsl(var(--bh), var(--bs), var(--bl))',
        }}
      >
        {/* Color picker */}
        <section style={{ marginBottom: 'var(--sp-xl)' }}>
          <ThemePicker />
        </section>

        {/* Divider */}
        <div className="h-px w-full" style={{ marginBottom: 'var(--sp-xl)', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }} />

        {/* Typetags */}
        <section style={{ marginBottom: 'var(--sp-xl)' }}>
          {typetags.length === 0 && (
            <div style={{ marginBottom: 'var(--sp-md)' }}>
              <FunctionButton onClick={initDefaults} size="sm">
                add defaults
              </FunctionButton>
            </div>
          )}

          <div className="flex flex-wrap" style={{ gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)' }}>
            {typetags.map((tag, i) => {
              const color = tagColor(i)
              return (
                <button
                  key={tag.id}
                  onClick={() => deleteTypetag(tag.id)}
                  className="font-mono font-black active:scale-90 uppercase"
                  style={{
                    padding: 'var(--sp-sm) var(--sp-lg)',
                    fontSize: 'clamp(11px, 1.3vw, 14px)',
                    color,
                    border: `3px solid ${color}`,
                    backgroundColor: 'transparent',
                  }}
                  title={`remove ${tag.name}`}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>

          <div className="flex items-center" style={{ gap: 'var(--sp-sm)' }}>
            <input
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTypetag()}
              placeholder="new typetag"
              className="flex-1 font-mono font-black bg-transparent border-none outline-none"
              style={{
                color: 'hsl(var(--h), var(--s), var(--l))',
                borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.15)',
                paddingBottom: 'var(--sp-xs)',
              }}
            />
            <button
              onClick={addTypetag}
              className="font-mono font-black"
              style={{
                padding: 'var(--sp-xs) var(--sp-md)',
                color: 'hsl(var(--h), var(--s), var(--l))',
                border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
              }}
            >
              +
            </button>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px w-full" style={{ marginBottom: 'var(--sp-xl)', backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }} />

        {/* Week start */}
        <section style={{ marginBottom: 'var(--sp-xl)' }}>
          <div className="flex" style={{ gap: 'var(--sp-sm)' }}>
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
        <section className="mt-auto flex-shrink-0" style={{ paddingTop: 'var(--sp-lg)' }}>
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
