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
      className={`${fullWidth ? 'w-full' : ''} px-4 py-2 font-mono font-black flex items-center justify-center gap-2 outline-none focus:outline-none select-none uppercase active:scale-90 ${disabled && !overrideColor ? 'opacity-40' : ''} ${className}`}
      style={{
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
