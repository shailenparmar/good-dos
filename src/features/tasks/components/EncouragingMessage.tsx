import { useEffect, useState } from 'react'
import { getRandomMessage } from '@shared/utils/messages'

interface EncouragingMessageProps {
  show: boolean
  onDone: () => void
}

export function EncouragingMessage({ show, onDone }: EncouragingMessageProps) {
  const [message, setMessage] = useState('')
  const [phase, setPhase] = useState<'hidden' | 'in' | 'hold' | 'out'>('hidden')

  useEffect(() => {
    if (!show) return

    setMessage(getRandomMessage())
    setPhase('in')

    const holdTimer = setTimeout(() => setPhase('hold'), 200)
    const outTimer = setTimeout(() => setPhase('out'), 1000)
    const doneTimer = setTimeout(() => {
      setPhase('hidden')
      onDone()
    }, 1500)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(outTimer)
      clearTimeout(doneTimer)
    }
  }, [show, onDone])

  if (phase === 'hidden') return null

  const opacity = phase === 'in' ? 1 : phase === 'hold' ? 1 : 0

  return (
    <span
      className="text-xs font-mono ml-2 inline-block"
      style={{
        color: 'hsla(var(--h), var(--s), var(--l), 0.6)',
        opacity,
        transition: 'opacity 0.3s ease',
      }}
    >
      {message}
    </span>
  )
}
