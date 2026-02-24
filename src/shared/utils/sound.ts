let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(freq1: number, freq2: number, duration: number, volume: number) {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const half = duration / 2

  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.value = freq1
  gain1.gain.setValueAtTime(volume, now)
  gain1.gain.exponentialRampToValueAtTime(0.01, now + half)
  osc1.connect(gain1).connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + half)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.value = freq2
  gain2.gain.setValueAtTime(volume, now + half * 0.8)
  gain2.gain.exponentialRampToValueAtTime(0.01, now + duration)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now + half * 0.8)
  osc2.stop(now + duration)
}

function playSnap() {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  const bufferSize = ctx.sampleRate * 0.04
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8)
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.12, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 4000
  filter.Q.value = 1.5

  noise.connect(filter).connect(noiseGain).connect(ctx.destination)
  noise.start(now)
  noise.stop(now + 0.04)
}

function playRisingArp() {
  // Fast rising arpeggio — C5 E5 G5 C6
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const start = now + i * 0.06
    gain.gain.setValueAtTime(0.15, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.2)
  })
}

function playVictoryFanfare() {
  // Quick G4 → B4 → D5 → G5
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const notes = [392, 493.88, 587.33, 783.99]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.08
    gain.gain.setValueAtTime(0.14, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.25)
  })
}

// None → snap only. Medium → victory fanfare. High → rising arp.
export function playCompleteSound(priority: number = 0) {
  if (priority === 2) {
    playRisingArp()
  } else if (priority === 1) {
    playVictoryFanfare()
  } else {
    playSnap()
  }
}

export function playSubtaskCompleteSound() {
  playSnap()
  playTone(659.25, 659.25, 0.15, 0.08)
}
