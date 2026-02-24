import { type ReactNode, type ButtonHTMLAttributes } from 'react'

interface FunctionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  isActive?: boolean
  size?: 'sm' | 'default'
  fullWidth?: boolean
  overrideColor?: string
}

export function FunctionButton({
  children,
  isActive = false,
  size = 'default',
  fullWidth = true,
  overrideColor,
  disabled,
  className = '',
  style,
  ...rest
}: FunctionButtonProps) {
  const borderColor = overrideColor
    ? overrideColor
    : isActive
      ? 'hsl(var(--h), var(--s), var(--l))'
      : 'hsla(var(--h), var(--s), var(--l), 0.2)'
  const textColor = 'hsl(var(--h), var(--s), var(--l))'
  const bgColor = isActive ? 'hsla(var(--h), var(--s), var(--l), 0.1)' : 'transparent'

  return (
    <button
      className={`${fullWidth ? 'w-full' : ''} font-mono font-black flex items-center justify-center outline-none focus:outline-none select-none uppercase active:scale-90 ${disabled && !overrideColor ? 'opacity-40' : ''} ${className}`}
      style={{
        padding: 'var(--sp-sm) var(--sp-lg)',
        gap: 'var(--sp-sm)',
        color: textColor,
        backgroundColor: bgColor,
        border: `${isActive ? '6px' : '3px'} solid ${borderColor}`,
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
