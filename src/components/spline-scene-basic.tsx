'use client'

// Reference demo from the component's docs — not used by any page. The site
// uses SplineScene inside the visual panel instead (see PanelScene.tsx).
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { SPLINE_SCENE_URL } from "@/lib/visuals";

export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden">
      {/* The demo's `fill="white"` belongs to a different Spotlight; this one is white by default. */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
      />

      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Interactive 3D
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg">
            Bring your UI to life with beautiful 3D scenes. Create immersive experiences
            that capture attention and enhance your design.
          </p>
        </div>

        {/* Right content */}
        <div className="flex-1 relative">
          <SplineScene
            scene={SPLINE_SCENE_URL}
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
