import { useState, useRef, useEffect } from 'react'

interface TaskInputProps {
  onAdd: (text: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function TaskInput({ onAdd, inputRef: externalRef }: TaskInputProps) {
  const [text, setText] = useState('')
  const internalRef = useRef<HTMLInputElement>(null)
  const ref = externalRef ?? internalRef

  useEffect(() => {
    // Focus on mount
    ref.current?.focus()
  }, [ref])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      e.preventDefault()
      onAdd(text.trim())
      setText('')
    }
  }

  return (
    <div
      className="flex items-center gap-1"
      style={{
        borderTop: '3px solid hsla(var(--h), var(--s), var(--l), 0.15)',
        minHeight: '44px',
      }}
    >
      <div className="w-6" />
      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
        <div
          className="w-6 h-6 flex items-center justify-center font-mono text-sm"
          style={{
            border: '3px solid hsla(var(--h), var(--s), var(--l), 0.2)',
            color: 'hsla(var(--h), var(--s), var(--l), 0.3)',
          }}
        >
          +
        </div>
      </div>
      <input
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="add a task..."
        className="flex-1 bg-transparent border-none outline-none font-mono"
        style={{
          fontSize: '16px',
          color: 'hsl(var(--h), var(--s), var(--l))',
        }}
      />
      <div className="w-11" />
    </div>
  )
}
