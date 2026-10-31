import { useCallback, useEffect, useRef, useState } from "react"

// Mic loudness 0..1. Uses the real microphone when the browser allows it and
// falls back to a simulated voice so the demo still moves where it does not.
export function useVoiceLevel() {
  const [level, setLevel] = useState(0)
  const [listening, setListening] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const stopRef = useRef<() => void>(() => {})

  const stop = useCallback(() => {
    stopRef.current()
    stopRef.current = () => {}
    setListening(false)
    setLevel(0)
  }, [])

  const start = useCallback(async () => {
    stop()
    let raf = 0
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      ctx = new AudioContext()
      analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      setSimulated(false)
    } catch {
      setSimulated(true)
    }
    const buf = analyser ? new Uint8Array(analyser.fftSize) : null
    const t0 = performance.now()
    const tick = () => {
      let v: number
      if (analyser && buf) {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (const b of buf) sum += ((b - 128) / 128) ** 2
        v = Math.min(1, Math.sqrt(sum / buf.length) * 4)
      } else {
        const t = (performance.now() - t0) / 1000
        v = Math.max(0, 0.35 + 0.3 * Math.sin(t * 5.1) + 0.2 * Math.sin(t * 11.3 + 1) + 0.12 * Math.sin(t * 23))
      }
      setLevel(prev => prev + (v - prev) * 0.35)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    setListening(true)
    stopRef.current = () => {
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach(t => t.stop())
      void ctx?.close()
    }
  }, [stop])

  useEffect(() => () => stopRef.current(), [])
  return { level, listening, simulated, start, stop }
}
