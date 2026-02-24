import { useRef, useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

interface ColorPickerProps {
  type: 'text' | 'background'
  part: 'sl' | 'hue'
}

export function ColorPicker({ type, part }: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const listenersRef = useRef<{
    move: ((e: MouseEvent | TouchEvent) => void) | null
    up: ((e?: MouseEvent | TouchEvent) => void) | null
  }>({ move: null, up: null })

  const {
    setHue, setSaturation, setLightness,
    setBgHue, setBgSaturation, setBgLightness,
    getColor, getBgColor,
  } = useTheme()

  const isText = type === 'text'
  const setHueValue = isText ? setHue : setBgHue
  const setSat = isText ? setSaturation : setBgSaturation
  const setLight = isText ? setLightness : setBgLightness

  const dotSize = isDragging ? 24 : 12
  const needleWidth = isDragging ? 24 : 8

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (listenersRef.current.move) {
        document.removeEventListener('mousemove', listenersRef.current.move as EventListener)
        document.removeEventListener('touchmove', listenersRef.current.move as EventListener)
      }
      if (listenersRef.current.up) {
        document.removeEventListener('mouseup', listenersRef.current.up as EventListener)
        document.removeEventListener('touchend', listenersRef.current.up as EventListener)
        document.removeEventListener('touchcancel', listenersRef.current.up as EventListener)
      }
    }
  }, [])

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true)

    if (part === 'sl') {
      const updateColor = (cx: number, cy: number) => {
        if (!pickerRef.current) return
        const rect = pickerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(cx - rect.left, rect.width))
        const y = Math.max(0, Math.min(cy - rect.top, rect.height))
        setSat(Math.round((x / rect.width) * 100))
        setLight(Math.round(100 - (y / rect.height) * 100))
      }

      updateColor(clientX, clientY)

      const handleMove = (e: MouseEvent | TouchEvent) => {
        const pt = 'touches' in e ? e.touches[0] : e
        if (pt) updateColor(pt.clientX, pt.clientY)
      }
      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove as EventListener)
        document.removeEventListener('mouseup', handleUp)
        document.removeEventListener('touchmove', handleMove as EventListener)
        document.removeEventListener('touchend', handleUp)
        document.removeEventListener('touchcancel', handleUp)
        listenersRef.current = { move: null, up: null }
        setIsDragging(false)
      }

      listenersRef.current = { move: handleMove, up: handleUp }
      document.addEventListener('mousemove', handleMove as EventListener)
      document.addEventListener('mouseup', handleUp)
      document.addEventListener('touchmove', handleMove as EventListener, { passive: false })
      document.addEventListener('touchend', handleUp)
      document.addEventListener('touchcancel', handleUp)
    } else {
      // Hue — HORIZONTAL
      const updateHue = (cx: number) => {
        if (!pickerRef.current) return
        const rect = pickerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(cx - rect.left, rect.width))
        setHueValue(Math.round((x / rect.width) * 360))
      }

      updateHue(clientX)

      const handleMove = (e: MouseEvent | TouchEvent) => {
        const pt = 'touches' in e ? e.touches[0] : e
        if (pt) updateHue(pt.clientX)
      }
      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove as EventListener)
        document.removeEventListener('mouseup', handleUp)
        document.removeEventListener('touchmove', handleMove as EventListener)
        document.removeEventListener('touchend', handleUp)
        document.removeEventListener('touchcancel', handleUp)
        listenersRef.current = { move: null, up: null }
        setIsDragging(false)
      }

      listenersRef.current = { move: handleMove, up: handleUp }
      document.addEventListener('mousemove', handleMove as EventListener)
      document.addEventListener('mouseup', handleUp)
      document.addEventListener('touchmove', handleMove as EventListener, { passive: false })
      document.addEventListener('touchend', handleUp)
      document.addEventListener('touchcancel', handleUp)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    startDrag(e.clientX, e.clientY)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (touch) startDrag(touch.clientX, touch.clientY)
  }

  // CSS var expressions for indicator positions
  // Hue is now horizontal: left position = hue/360 * 100%
  const needleLeft = isText ? 'calc(var(--h) / 360 * 100%)' : 'calc(var(--bh) / 360 * 100%)'
  const dotLeft = isText ? 'calc(var(--ts-p) * 1%)' : 'calc(var(--bs-p) * 1%)'
  const dotTop = isText ? 'calc(var(--tl-p) * 1%)' : 'calc(var(--bl-p) * 1%)'

  const label = isText ? 'text' : 'background'

  if (part === 'hue') {
    return (
      <div
        ref={pickerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: isDragging ? 10 : 1,
          background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
        }}
      >
        {/* Label */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-mono font-black"
          style={{
            fontSize: 'clamp(13px, 1.8vw, 20px)',
            color: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          {label}
        </div>
        {/* Vertical needle */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0,
            bottom: 0,
            left: needleLeft,
            width: `${needleWidth}px`,
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    )
  }

  return (
    <div
      ref={pickerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="relative"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        zIndex: isDragging ? 10 : 2,
        background: isText
          ? 'linear-gradient(to bottom, white, transparent 50%), linear-gradient(to top, black, transparent 50%), linear-gradient(to right, hsl(var(--h), 0%, 50%), hsl(var(--h), 100%, 50%))'
          : 'linear-gradient(to bottom, white, transparent 50%), linear-gradient(to top, black, transparent 50%), linear-gradient(to right, hsl(var(--bh), 0%, 50%), hsl(var(--bh), 100%, 50%))',
      }}
    >
      {/* Label */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-mono font-black"
        style={{
          fontSize: 'clamp(13px, 1.8vw, 20px)',
          color: 'rgba(0, 0, 0, 0.4)',
        }}
      >
        {label}
      </div>
      <div
        className="absolute pointer-events-none"
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          left: dotLeft,
          top: dotTop,
          transform: 'translate(-50%, -50%)',
          backgroundColor: isText ? getBgColor() : getColor(),
        }}
      />
    </div>
  )
}
