import type { gsap } from "@/lib/motion";

/**
 * Lets visitors drag (mouse/touch) or horizontally scroll a looping ribbon.
 * `dir` is +1 when the tween moves the track right as progress grows, -1 when left.
 */
export function attachStripDrag(
  viewport: HTMLElement,
  track: HTMLElement,
  tween: gsap.core.Tween,
  dir: 1 | -1,
) {
  let startX = 0;
  let startP = 0;
  let down = false;
  let moved = false;
  const half = () => track.scrollWidth / 2 || 1;
  const setP = (p: number) => tween.progress(((p % 1) + 1) % 1);

  const onDown = (e: PointerEvent) => {
    down = true;
    moved = false;
    startX = e.clientX;
    startP = tween.progress();
    tween.pause();
  };
  const onMove = (e: PointerEvent) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5 && !moved) {
      moved = true;
      viewport.setPointerCapture?.(e.pointerId);
    }
    if (moved) setP(startP + (dir * dx) / half());
  };
  const onUp = () => {
    down = false;
    if (e_isTouch) tween.play();
  };
  let e_isTouch = false;
  const onType = (e: PointerEvent) => (e_isTouch = e.pointerType !== "mouse");
  const onClick = (e: MouseEvent) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  };
  const onWheel = (e: WheelEvent) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!d) return;
    e.preventDefault();
    setP(tween.progress() - (dir * d) / half());
  };

  viewport.style.touchAction = "pan-y";
  viewport.style.cursor = "grab";
  viewport.addEventListener("pointerdown", onType);
  viewport.addEventListener("pointerdown", onDown);
  viewport.addEventListener("pointermove", onMove);
  viewport.addEventListener("pointerup", onUp);
  viewport.addEventListener("pointercancel", onUp);
  viewport.addEventListener("click", onClick, true);
  viewport.addEventListener("dragstart", (e) => e.preventDefault());
  viewport.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    viewport.removeEventListener("pointerdown", onType);
    viewport.removeEventListener("pointerdown", onDown);
    viewport.removeEventListener("pointermove", onMove);
    viewport.removeEventListener("pointerup", onUp);
    viewport.removeEventListener("pointercancel", onUp);
    viewport.removeEventListener("click", onClick, true);
    viewport.removeEventListener("wheel", onWheel);
  };
}
