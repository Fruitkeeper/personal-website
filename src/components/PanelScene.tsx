import { useEffect, useRef, useState } from 'react'
import type { Application } from '@splinetool/runtime'
import { SplineScene } from '@/components/ui/splite'
import { SPLINE_SCENE_URL } from '@/lib/visuals'

/**
 * The visual panel's 3D scene. Wraps SplineScene with the site's runtime rules:
 * cursor tracking anywhere on the page, paused while offscreen (mobile banner), and a still frame
 * under prefers-reduced-motion.
 */
export default function PanelScene() {
  const ref = useRef<HTMLDivElement>(null)
  const [app, setApp] = useState<Application | null>(null)

  const handleLoad = (loaded: Application) => {
    // The text column sits over most of the page; global events let the robot
    // follow the cursor everywhere, not just inside the 40% panel.
    // (The scene's background is already transparent, so the nebula shows through.)
    loaded.setGlobalEvents(true)
    setApp(loaded)
  }

  useEffect(() => {
    const el = ref.current
    if (!app || !el) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let onScreen = true

    const sync = () => {
      const shouldRun = onScreen && !reducedMotion.matches && !document.hidden
      if (shouldRun && app.isStopped) app.play()
      if (!shouldRun && !app.isStopped) app.stop()
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    observer.observe(el)
    document.addEventListener('visibilitychange', sync)
    reducedMotion.addEventListener('change', sync)

    // Let the first frame render before applying reduced motion, so those
    // users get a still robot rather than an empty panel.
    const frame = requestAnimationFrame(() => requestAnimationFrame(sync))

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reducedMotion.removeEventListener('change', sync)
    }
  }, [app])

  return (
    <div ref={ref} className="scene" data-ready={app ? '' : undefined}>
      <SplineScene scene={SPLINE_SCENE_URL} className="w-full h-full" onLoad={handleLoad} />
    </div>
  )
}
