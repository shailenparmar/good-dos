interface CalendarNavProps {
  title: string
  isCurrentPeriod: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onSettings?: () => void
}

export function CalendarNav({
  title,
  isCurrentPeriod,
  onPrev,
  onNext,
  onToday,
  onSettings,
}: CalendarNavProps) {
  const btnStyle = {
    color: 'hsl(var(--h), var(--s), var(--l))',
    backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.06)',
    border: '3px solid hsla(var(--h), var(--s), var(--l), 0.15)',
  }

  return (
    <div
      className="flex-shrink-0 px-2 py-1.5 flex flex-col gap-1"
      style={{
        borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.1)',
      }}
    >
      {/* Row 1 — Title */}
      <span
        className="font-mono font-black text-center"
        style={{
          color: 'hsl(var(--h), var(--s), var(--l))',
          fontSize: 'clamp(22px, 3vw, 36px)',
          lineHeight: 1.1,
        }}
      >
        {title}
      </span>

      {/* Row 2 — ‹ › today settings */}
      <div className="flex items-stretch gap-1.5 justify-center">
        <button
          onClick={onPrev}
          className="font-mono font-black flex items-center justify-center rounded-sm active:scale-90"
          style={{
            fontSize: 'clamp(22px, 3vw, 36px)',
            padding: '4px clamp(10px, 1.5vw, 20px)',
            ...btnStyle,
          }}
        >
          ‹
        </button>
        <button
          onClick={onNext}
          className="font-mono font-black flex items-center justify-center rounded-sm active:scale-90"
          style={{
            fontSize: 'clamp(22px, 3vw, 36px)',
            padding: '4px clamp(10px, 1.5vw, 20px)',
            ...btnStyle,
          }}
        >
          ›
        </button>
        <button
          onClick={onToday}
          disabled={isCurrentPeriod}
          className="font-mono font-black flex items-center justify-center rounded-sm active:scale-90"
          style={{
            fontSize: 'clamp(13px, 1.8vw, 20px)',
            padding: '4px clamp(12px, 2vw, 24px)',
            opacity: 1,
            ...btnStyle,
          }}
        >
          today
        </button>
        {onSettings && (
          <button
            onClick={onSettings}
            className="flex items-center justify-center rounded-sm active:scale-90"
            style={{
              padding: '4px clamp(10px, 1.5vw, 20px)',
              ...btnStyle,
            }}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                width: 'clamp(16px, 2vw, 24px)',
                height: 'clamp(16px, 2vw, 24px)',
              }}
            >
              <circle cx="10" cy="10" r="3" />
              <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
