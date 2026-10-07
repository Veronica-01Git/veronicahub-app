import { useEffect, useRef } from "react";

// Source-space calibration for the canonical 768 × 1366 portrait.
// The displacement fades to zero inside the iris: eyelids and face stay fixed.
const VERTEX = `attribute vec2 a; varying vec2 uv;
void main(){uv=vec2((a.x+1.0)*.5,(1.0-a.y)*.5);gl_Position=vec4(a,0.,1.);}`;
const FRAGMENT = `precision highp float;
uniform sampler2D portrait; uniform vec2 viewSize, offset, gaze;
uniform float scale; varying vec2 uv;
void main(){
  vec2 p=(uv*viewSize-offset)/scale;
  float d=min(distance(p,vec2(234.,484.)),distance(p,vec2(511.,482.)));
  float pupil=1.-smoothstep(14.,24.,d);
  vec2 samplePoint=p-gaze*pupil;
  gl_FragColor=texture2D(portrait,samplePoint/vec2(768.,1366.));
}`;

/** Static SSR image with an optional, strictly local pupil-displacement layer. */
export function VeronicaGaze() {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    if (reduced.matches || !fine.matches) return;
    let disposed = false;
    let stop = () => {};
    const init = () => {
      if (disposed || image.naturalWidth !== 768 || image.naturalHeight !== 1366) return;
      const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
      });
      if (!gl) return;
      const shaders: WebGLShader[] = [];
      const compile = (kind: number, source: string) => {
        const shader = gl.createShader(kind);
        if (!shader) return null;
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
      };
      const vertex = compile(gl.VERTEX_SHADER, VERTEX);
      const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
      const program = gl.createProgram();
      const buffer = gl.createBuffer();
      const texture = gl.createTexture();
      let frame = 0;
      let active = true;
      let visible = false;
      let x = 0,
        y = 0,
        tx = 0,
        ty = 0;
      let width = 0,
        height = 0,
        scale = 1,
        ox = 0,
        oy = 0;
      const fallback = () => {
        canvas.style.opacity = "0";
        image.style.visibility = "";
      };
      const release = () => {
        cancelAnimationFrame(frame);
        fallback();
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        shaders.forEach((s) => gl.deleteShader(s));
      };
      if (!vertex || !fragment || !program || !buffer || !texture) {
        release();
        return;
      }
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        release();
        return;
      }
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const attribute = gl.getAttribLocation(program, "a");
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      } catch {
        release();
        return;
      }
      const sizeUniform = gl.getUniformLocation(program, "viewSize");
      const offsetUniform = gl.getUniformLocation(program, "offset");
      const scaleUniform = gl.getUniformLocation(program, "scale");
      const gazeUniform = gl.getUniformLocation(program, "gaze");
      const draw = () => {
        if (!active || !width || !height || gl.isContextLost()) return;
        gl.uniform2f(sizeUniform, width, height);
        gl.uniform2f(offsetUniform, ox, oy);
        gl.uniform1f(scaleUniform, scale);
        gl.uniform2f(gazeUniform, x, y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };
      const resize = () => {
        const box = image.getBoundingClientRect();
        const css = getComputedStyle(image);
        width = box.width;
        height = box.height;
        const position = css.objectPosition.split(" ").map(parseFloat);
        scale = Math.max(width / 768, height / 1366);
        ox = (width - 768 * scale) * (position[0] / 100);
        oy = (height - 1366 * scale) * (position[1] / 100);
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
        canvas.style.maskImage = css.maskImage;
        canvas.style.opacity = css.opacity;
        draw();
        image.style.visibility = "hidden";
      };
      let last = 0;
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
      const reset = () => {
        tx = ty = 0;
        wake();
      };
      const move = (event: PointerEvent) => {
        if (!visible || !active || event.pointerType !== "mouse") return;
        const box = image.getBoundingClientRect();
        const cx = box.left + ox + 372.5 * scale,
          cy = box.top + oy + 483 * scale;
        const dx = (event.clientX - cx) / Math.max(innerWidth * 0.4, 1);
        const dy = (event.clientY - cy) / Math.max(innerHeight * 0.4, 1);
        const length = Math.max(1, Math.hypot(dx, dy));
        tx = (5 * dx) / length;
        ty = (3 * dy) / length;
        wake();
      };
      const visibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
          tx = ty = x = y = 0;
        } else {
          draw();
          wake();
        }
      };
      const preference = () => {
        active = !reduced.matches && fine.matches;
        tx = ty = x = y = 0;
        cancelAnimationFrame(frame);
        frame = 0;
        if (!active) fallback();
        else resize();
      };
      const lost = () => {
        active = false;
        cancelAnimationFrame(frame);
        frame = 0;
        fallback();
      };
      const observer = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (!visible) {
          cancelAnimationFrame(frame);
          frame = 0;
          tx = ty = x = y = 0;
          draw();
        } else {
          draw();
          wake();
        }
      });
      const resizer = new ResizeObserver(() => {
        if (active) resize();
      });
      resize();
      observer.observe(image);
      resizer.observe(image);
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", reset);
      window.addEventListener("blur", reset);
      document.addEventListener("visibilitychange", visibility);
      canvas.addEventListener("webglcontextlost", lost);
      reduced.addEventListener("change", preference);
      fine.addEventListener("change", preference);
      stop = () => {
        active = false;
        observer.disconnect();
        resizer.disconnect();
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", reset);
        window.removeEventListener("blur", reset);
        document.removeEventListener("visibilitychange", visibility);
        canvas.removeEventListener("webglcontextlost", lost);
        reduced.removeEventListener("change", preference);
        fine.removeEventListener("change", preference);
        release();
      };
    };
    if (image.complete && image.naturalWidth) init();
    else image.addEventListener("load", init, { once: true });
    return () => {
      disposed = true;
      image.removeEventListener("load", init);
      stop();
    };
  }, []);

  return (
    <>
      <img
        ref={imageRef}
        src="/images/veronica/veronica-hero-static.webp"
        alt=""
        width={768}
        height={1366}
        fetchPriority="high"
        decoding="async"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
