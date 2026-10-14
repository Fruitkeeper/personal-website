import { LampContainer } from "@/components/ui/lamp";

/**
 * The page-load stage light: the lamp's beams open up while the toaster rises
 * into them (see scripts/intro.ts). Purely decorative; fades out when the
 * intro ends. Sits behind the toaster (z-index 0 vs its stage's 1).
 */
export default function LampIntro() {
  return (
    <div className="lamp-intro" aria-hidden="true" data-lamp-intro>
      <LampContainer className="min-h-dvh rounded-none bg-[#020617]">{null}</LampContainer>
    </div>
  );
}
