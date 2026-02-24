import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { ColorPreset } from '../types'
import { lsGetNumber, lsSet } from '@shared/storage'

export const DEFAULT_PRESETS: ColorPreset[] = [
  { hue: 0, sat: 0, light: 95, bgHue: 0, bgSat: 0, bgLight: 8 },        // monochrome
  { hue: 210, sat: 60, light: 85, bgHue: 220, bgSat: 50, bgLight: 12 },  // navy
  { hue: 140, sat: 55, light: 75, bgHue: 150, bgSat: 40, bgLight: 10 },  // forest
  { hue: 40, sat: 80, light: 70, bgHue: 30, bgSat: 30, bgLight: 10 },    // amber
  { hue: 270, sat: 60, light: 80, bgHue: 260, bgSat: 40, bgLight: 12 },  // purple
]

interface ThemeContextValue {
  hue: number
  saturation: number
  lightness: number
  bgHue: number
  bgSaturation: number
  bgLightness: number
  setHue: (v: number) => void
  setSaturation: (v: number) => void
  setLightness: (v: number) => void
  setBgHue: (v: number) => void
  setBgSaturation: (v: number) => void
  setBgLightness: (v: number) => void
  applyPreset: (p: ColorPreset) => void
  getColor: (lightnessOffset?: number) => string
  getBgColor: () => string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [hue, setHueState] = useState(() => lsGetNumber('colorHue', 0))
  const [saturation, setSaturationState] = useState(() => lsGetNumber('colorSaturation', 0))
  const [lightness, setLightnessState] = useState(() => lsGetNumber('colorLightness', 95))
  const [bgHue, setBgHueState] = useState(() => lsGetNumber('bgHue', 0))
  const [bgSaturation, setBgSaturationState] = useState(() => lsGetNumber('bgSaturation', 0))
  const [bgLightness, setBgLightnessState] = useState(() => lsGetNumber('bgLightness', 8))

  const persist = useCallback((key: string, val: number, setter: (v: number) => void) => {
    setter(val)
    lsSet(key, String(val))
  }, [])

  const setHue = useCallback((v: number) => persist('colorHue', v, setHueState), [persist])
  const setSaturation = useCallback((v: number) => persist('colorSaturation', v, setSaturationState), [persist])
  const setLightness = useCallback((v: number) => persist('colorLightness', v, setLightnessState), [persist])
  const setBgHue = useCallback((v: number) => persist('bgHue', v, setBgHueState), [persist])
  const setBgSaturation = useCallback((v: number) => persist('bgSaturation', v, setBgSaturationState), [persist])
  const setBgLightness = useCallback((v: number) => persist('bgLightness', v, setBgLightnessState), [persist])

  const applyPreset = useCallback((p: ColorPreset) => {
    setHue(p.hue)
    setSaturation(p.sat)
    setLightness(p.light)
    setBgHue(p.bgHue)
    setBgSaturation(p.bgSat)
    setBgLightness(p.bgLight)
  }, [setHue, setSaturation, setLightness, setBgHue, setBgSaturation, setBgLightness])

  useEffect(() => {
    const el = document.documentElement
    el.style.setProperty('--h', String(hue))
    el.style.setProperty('--s', saturation + '%')
    el.style.setProperty('--l', lightness + '%')
    el.style.setProperty('--bh', String(bgHue))
    el.style.setProperty('--bs', bgSaturation + '%')
    el.style.setProperty('--bl', bgLightness + '%')
    // Position CSS vars for color picker indicators (0-100 range)
    el.style.setProperty('--th-p', String((360 - hue) / 360 * 100))
    el.style.setProperty('--ts-p', String(saturation))
    el.style.setProperty('--tl-p', String(100 - lightness))
    el.style.setProperty('--bh-p', String((360 - bgHue) / 360 * 100))
    el.style.setProperty('--bs-p', String(bgSaturation))
    el.style.setProperty('--bl-p', String(100 - bgLightness))
  }, [hue, saturation, lightness, bgHue, bgSaturation, bgLightness])

  // Sync theme-color meta and body background
  useEffect(() => {
    const s = bgSaturation / 100
    const l = bgLightness / 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const k = (n + bgHue / 30) % 12
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * c).toString(16).padStart(2, '0')
    }
    const hex = `#${f(0)}${f(8)}${f(4)}`
    document.getElementById('theme-color-meta')?.setAttribute('content', hex)
    document.documentElement.style.backgroundColor = hex
    document.body.style.backgroundColor = hex
  }, [bgHue, bgSaturation, bgLightness])

  const getColor = useCallback((lightnessOffset: number = 0) => {
    if (lightnessOffset === 0) return 'hsl(var(--h), var(--s), var(--l))'
    if (lightnessOffset > 0)
      return `hsl(var(--h), var(--s), min(100%, calc(var(--l) + ${lightnessOffset}%)))`
    return `hsl(var(--h), var(--s), max(0%, calc(var(--l) + ${lightnessOffset}%)))`
  }, [])

  const getBgColor = useCallback(() => 'hsl(var(--bh), var(--bs), var(--bl))', [])

  return (
    <ThemeContext.Provider value={{
      hue, saturation, lightness, bgHue, bgSaturation, bgLightness,
      setHue, setSaturation, setLightness, setBgHue, setBgSaturation, setBgLightness,
      applyPreset, getColor, getBgColor,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
