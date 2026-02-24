import { useState, type ReactNode, type ButtonHTMLAttributes } from 'react'

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
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  const borderDefault = 'hsla(var(--h), var(--s), var(--l), 0.25)'
  const borderHover = 'hsla(var(--h), var(--s), var(--l), 0.5)'
  const borderActive = 'hsl(var(--h), var(--s), max(0%, calc(var(--l) * 0.65)))'
  const textColor = 'hsl(var(--h), var(--s), var(--l))'
  const hoverBg = 'hsla(var(--h), var(--s), 50%, 0.08)'

  const getBorderColor = () => {
    if (overrideColor) return overrideColor
    if (disabled) return borderDefault
    if (isClicked) return borderActive
    if (isActive) return borderHover
    if (isHovered) return borderHover
    return borderDefault
  }

  const getBackgroundColor = () => {
    if (overrideColor) return 'transparent'
    if (isActive) return hoverBg
    if (isHovered) return hoverBg
    return 'transparent'
  }

  return (
    <button
      className={`${fullWidth ? 'w-full' : ''} px-4 py-2 font-mono font-black rounded flex items-center justify-center gap-2 outline-none focus:outline-none select-none uppercase ${disabled && !overrideColor ? 'opacity-40' : ''} ${className}`}
      style={{
        color: textColor,
        backgroundColor: getBackgroundColor(),
        border: `${isActive || isClicked ? '6px' : '3px'} solid ${getBorderColor()}`,
        ...style,
      }}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsClicked(false) }}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      {...rest}
    >
      {children}
    </button>
  )
}
