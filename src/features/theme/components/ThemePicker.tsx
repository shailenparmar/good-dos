import { useCallback } from 'react'
import { useTheme, DEFAULT_PRESETS } from '../context/ThemeContext'
import { ColorPicker } from './ColorPicker'

export function ThemePicker() {
  const {
    hue, saturation, lightness,
    bgHue, bgSaturation, bgLightness,
    applyPreset,
    setHue, setSaturation, setLightness,
    setBgHue, setBgSaturation, setBgLightness,
  } = useTheme()

  const randomize = useCallback(() => {
    setHue(Math.floor(Math.random() * 360))
    setSaturation(Math.floor(Math.random() * 60 + 20))
    setLightness(Math.floor(Math.random() * 40 + 50))
    setBgHue(Math.floor(Math.random() * 360))
    setBgSaturation(Math.floor(Math.random() * 40 + 10))
    setBgLightness(Math.floor(Math.random() * 12 + 5))
  }, [setHue, setSaturation, setLightness, setBgHue, setBgSaturation, setBgLightness])

  const savePreset = useCallback(() => {
    const raw = localStorage.getItem('customColorPresets')
    const existing = raw ? JSON.parse(raw) : []
    existing.push({
      hue, sat: saturation, light: lightness,
      bgHue, bgSat: bgSaturation, bgLight: bgLightness,
    })
    localStorage.setItem('customColorPresets', JSON.stringify(existing))
  }, [hue, saturation, lightness, bgHue, bgSaturation, bgLightness])

  const customPresets = (() => {
    try {
      const raw = localStorage.getItem('customColorPresets')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })()

  const deleteCustom = useCallback((index: number) => {
    const raw = localStorage.getItem('customColorPresets')
    const existing = raw ? JSON.parse(raw) : []
    existing.splice(index, 1)
    localStorage.setItem('customColorPresets', JSON.stringify(existing))
  }, [])

  const allPresets = [...DEFAULT_PRESETS, ...customPresets]

  return (
    <div className="flex flex-col" style={{ gap: 'var(--sp-md)' }}>
      {/* 2x2 color picker grid — no labels needed */}
      <div
        className="grid"
        style={{ gap: 'var(--sp-sm)', gridTemplateColumns: '1fr 1fr' }}
      >
        <ColorPicker type="text" part="sl" />
        <ColorPicker type="background" part="sl" />
        <ColorPicker type="text" part="hue" />
        <ColorPicker type="background" part="hue" />
      </div>

      {/* Presets */}
      <div
        className="grid"
        style={{ gap: 'var(--sp-sm)', gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {allPresets.map((preset: typeof DEFAULT_PRESETS[0], i: number) => (
          <button
            key={i}
            onClick={() => applyPreset(preset)}
            onContextMenu={i >= DEFAULT_PRESETS.length ? (e) => {
              e.preventDefault()
              deleteCustom(i - DEFAULT_PRESETS.length)
            } : undefined}
            className="aspect-square font-mono font-black flex items-center justify-center uppercase"
            style={{
              backgroundColor: `hsl(${preset.bgHue}, ${preset.bgSat}%, ${preset.bgLight}%)`,
              border: `3px solid hsl(${preset.hue}, ${preset.sat}%, ${preset.light}%)`,
              color: `hsl(${preset.hue}, ${preset.sat}%, ${preset.light}%)`,
            }}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={randomize}
          className="aspect-square font-mono font-black flex items-center justify-center uppercase"
          style={{
            border: '3px solid hsla(var(--h), var(--s), var(--l), 0.25)',
            color: 'hsl(var(--h), var(--s), var(--l))',
          }}
        >
          rand
        </button>

        <button
          onClick={savePreset}
          className="aspect-square font-mono font-black flex items-center justify-center uppercase"
          style={{
            border: '3px solid hsla(var(--h), var(--s), var(--l), 0.25)',
            color: 'hsl(var(--h), var(--s), var(--l))',
          }}
        >
          save
        </button>
      </div>
    </div>
  )
}
