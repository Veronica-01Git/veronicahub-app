import { useEffect, useRef } from "react";

const EYES = [{ x: 234, y: 484 }, { x: 511, y: 482 }];
const PATCH = 64;
const OUTPUT = 48;

/** Warp only the iris, feathering to zero before the eyelids. No GPU required. */
function warpIris(source: ImageData, output: ImageData, gazeX: number, gazeY: number) {
  for (let row = 0; row < OUTPUT; row++) {
    for (let col = 0; col < OUTPUT; col++) {
      const distance = Math.hypot(col - OUTPUT / 2, row - OUTPUT / 2);
      const t = Math.max(0, Math.min(1, (distance - 14) / 10));
      const weight = 1 - t * t * (3 - 2 * t);
      const sx = col + (PATCH - OUTPUT) / 2 - gazeX * weight;
      const sy = row + (PATCH - OUTPUT) / 2 - gazeY * weight;
      const left = Math.floor(sx), top = Math.floor(sy);
      const fx = sx - left, fy = sy - top;
      const index = (row * OUTPUT + col) * 4;
      for (let channel = 0; channel < 4; channel++) {
        const a = source.data[(top * PATCH + left) * 4 + channel];
        const b = source.data[(top * PATCH + left + 1) * 4 + channel];
        const c = source.data[((top + 1) * PATCH + left) * 4 + channel];
        const d = source.data[((top + 1) * PATCH + left + 1) * 4 + channel];
        output.data[index + channel] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
      }
    }
  }
}

/** Static SSR portrait; Canvas 2D moves only its two calibrated pupils. */
export function VeronicaGaze() {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let stop = () => {};
    const init = () => {
      if (disposed || image.naturalWidth !== 768 || image.naturalHeight !== 1366) return;
      const ctx = canvas.getContext("2d");
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = 768;
      sourceCanvas.height = 1366;
      const source = sourceCanvas.getContext("2d", { willReadFrequently: true });
      const patchCanvas = document.createElement("canvas");
      patchCanvas.width = patchCanvas.height = OUTPUT;
      const patch = patchCanvas.getContext("2d");
      if (!ctx || !source || !patch) {
        canvas.dataset.gaze = "static-no-canvas";
        return;
      }
      source.drawImage(image, 0, 0);
      let patches: ImageData[];
      try {
        patches = EYES.map(({ x, y }) => source.getImageData(x - PATCH / 2, y - PATCH / 2, PATCH, PATCH));
      } catch {
        canvas.dataset.gaze = "static-texture-unavailable";
        return;
      }
      const output = patch.createImageData(OUTPUT, OUTPUT);
      let frame = 0, last = 0;
      let visible = false;
      let active = !reduced.matches && fine.matches;
      let x = 0, y = 0, tx = 0, ty = 0;
      let width = 0, height = 0, scale = 1, ox = 0, oy = 0;
      const fallback = () => {
        canvas.style.opacity = "0";
        image.style.visibility = "";
        canvas.dataset.gaze = reduced.matches ? "static-reduced-motion" : "static-touch";
      };
      const draw = () => {
        if (!active || !width || !height) return;
        // Redraw the static source to avoid accumulating interpolation artifacts.
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, ox, oy, 768 * scale, 1366 * scale);
        EYES.forEach((eye, index) => {
          warpIris(patches[index], output, x, y);
          patch.putImageData(output, 0, 0);
          ctx.drawImage(patchCanvas, ox + (eye.x - OUTPUT / 2) * scale, oy + (eye.y - OUTPUT / 2) * scale, OUTPUT * scale, OUTPUT * scale);
        });
      };
      const resize = () => {
        if (!active) { fallback(); return; }
        const box = image.getBoundingClientRect();
        const css = getComputedStyle(image);
        width = box.width;
        height = box.height;
        if (!width || !height) return;
        const position = css.objectPosition.split(" ").map(parseFloat);
        scale = Math.max(width / 768, height / 1366);
        ox = (width - 768 * scale) * position[0] / 100;
        oy = (height - 1366 * scale) * position[1] / 100;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        canvas.style.maskImage = css.maskImage;
        canvas.style.setProperty("-webkit-mask-image", css.maskImage);
        draw();
        canvas.style.opacity = css.opacity;
        image.style.visibility = "hidden";
        canvas.dataset.gaze = "tracking-2d";
      };
      const tick = (now: number) => {
        frame = 0;
        if (!active || !visible || document.hidden) return;
        const ease = 1 - Math.exp(-Math.min(now - last || 16, 50) / 90);
        last = now;
        x += (tx - x) * ease;
        y += (ty - y) * ease;
        draw();
        if (Math.abs(tx - x) + Math.abs(ty - y) > 0.005) frame = requestAnimationFrame(tick);
      };
      const wake = () => {
        if (active && visible && !document.hidden && !frame) {
          last = performance.now();
          frame = requestAnimationFrame(tick);
        }
      };
      const reset = () => { tx = ty = 0; wake(); };
      const move = (event: PointerEvent) => {
        if (!visible || !active || event.pointerType !== "mouse") return;
        const box = image.getBoundingClientRect();
        const cx = box.left + ox + 372.5 * scale;
        const cy = box.top + oy + 483 * scale;
        const dx = (event.clientX - cx) / Math.max(innerWidth * 0.4, 1);
        const dy = (event.clientY - cy) / Math.max(innerHeight * 0.4, 1);
        const length = Math.max(1, Math.hypot(dx, dy));
        tx = 5 * dx / length;
        ty = 3 * dy / length;
        wake();
      };
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
          tx = ty = x = y = 0;
        } else { draw(); wake(); }
      };
      const preference = () => {
        active = !reduced.matches && fine.matches;
        tx = ty = x = y = 0;
        cancelAnimationFrame(frame);
        frame = 0;
        resize();
      };
      // Observe the visible canvas, not the image hidden behind it. A hidden
      // image may be excluded by visibility-aware intersection implementations.
      const observer = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (!visible) {
          cancelAnimationFrame(frame);
          frame = 0;
          tx = ty = x = y = 0;
          draw();
        } else { draw(); wake(); }
      });
      const resizer = new ResizeObserver(resize);
      resize();
      observer.observe(canvas);
      resizer.observe(image);
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", reset);
      window.addEventListener("blur", reset);
      document.addEventListener("visibilitychange", visibility);
      reduced.addEventListener("change", preference);
      fine.addEventListener("change", preference);
      stop = () => {
        active = false;
        cancelAnimationFrame(frame);
        observer.disconnect();
        resizer.disconnect();
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", reset);
        window.removeEventListener("blur", reset);
        document.removeEventListener("visibilitychange", visibility);
        reduced.removeEventListener("change", preference);
        fine.removeEventListener("change", preference);
        canvas.style.opacity = "0";
        image.style.visibility = "";
      };
    };
    if (image.complete && image.naturalWidth) init();
    else image.addEventListener("load", init, { once: true });
    return () => { disposed = true; image.removeEventListener("load", init); stop(); };
  }, []);

  return (
    <>
      <img ref={imageRef} src="/images/veronica/veronica-hero-static.webp" alt="" width={768} height={1366} fetchPriority="high" decoding="async" />
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }} />
    </>
  );
}
