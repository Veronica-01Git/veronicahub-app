import { useEffect, useRef, useState } from "react";

// Hero centerpiece for Veronica Studio — a living holographic core orbited by
// three rings (vídeo / imagem / voz). Same lazy-load + cleanup + reduced-motion
// discipline as HoloResumeOrbit, new geometry themed for multi-modal generation.

const SIZE = 420;
const NEON_GREEN = 0x39e37e;
const NEON_CYAN = 0x5ce6e6;
const NEON_VIOLET = 0x8a7bff;

export function HoloStudioCore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cleanupFns: Array<() => void> = [];

    (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        if (!cancelled) setSupported(false);
        return;
      }
      if (cancelled || !containerRef.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0.3, 5.2);
      camera.lookAt(0, 0, 0);

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        if (!cancelled) setSupported(false);
        return;
      }
      renderer.setSize(SIZE, SIZE);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      containerRef.current.appendChild(renderer.domElement);

      const holo = new THREE.Group();
      scene.add(holo);

      // Faceted core
      const coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
      const coreMat = new THREE.MeshPhysicalMaterial({
        color: 0x0a1f16,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
        metalness: 0.3,
        emissive: new THREE.Color(NEON_GREEN),
        emissiveIntensity: 0.5,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      holo.add(core);

      const coreEdgesGeo = new THREE.EdgesGeometry(coreGeo);
      const coreEdgeMat = new THREE.LineBasicMaterial({ color: NEON_GREEN, transparent: true, opacity: 0.85 });
      const coreEdges = new THREE.LineSegments(coreEdgesGeo, coreEdgeMat);
      holo.add(coreEdges);

      const innerLight = new THREE.PointLight(NEON_GREEN, 2.2, 4);
      holo.add(innerLight);

      // Three modality rings — vídeo, imagem, voz
      function makeRing(radius: number, tiltX: number, tiltZ: number, color: number, opacity: number) {
        const geo = new THREE.TorusGeometry(radius, 0.007, 8, 110);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = tiltX;
        mesh.rotation.z = tiltZ;
        holo.add(mesh);
        return mesh;
      }
      const ringVideo = makeRing(1.3, Math.PI / 2.4, 0.15, NEON_GREEN, 0.55);
      const ringImage = makeRing(1.62, Math.PI / 2.1, -0.55, NEON_CYAN, 0.45);
      const ringVoice = makeRing(1.94, Math.PI / 1.8, 1.1, NEON_VIOLET, 0.35);

      // Modality glyphs riding on each ring — simple, cheap shapes
      function attachGlyph(ring: InstanceType<typeof THREE.Mesh>, radius: number, color: number, shape: "tri" | "square" | "bars") {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
        if (shape === "tri") {
          const geo = new THREE.ConeGeometry(0.055, 0.09, 3);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.rotation.z = -Math.PI / 2;
          group.add(mesh);
        } else if (shape === "square") {
          const geo = new THREE.PlaneGeometry(0.09, 0.09);
          const edges = new THREE.EdgesGeometry(geo);
          group.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color })));
        } else {
          [-0.03, 0, 0.03].forEach((x, i) => {
            const h = 0.05 + (i % 2 === 0 ? 0.03 : 0.06);
            const geo = new THREE.PlaneGeometry(0.012, h);
            const bar = new THREE.Mesh(geo, mat);
            bar.position.x = x;
            group.add(bar);
          });
        }
        group.position.set(radius, 0, 0);
        ring.add(group);
        return group;
      }
      attachGlyph(ringVideo, 1.3, NEON_GREEN, "tri");
      attachGlyph(ringImage, 1.62, NEON_CYAN, "square");
      attachGlyph(ringVoice, 1.94, NEON_VIOLET, "bars");

      function makeParticles(count: number, radius: number, tiltX: number, tiltZ: number, color: number, size: number) {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
          const r = radius + (Math.random() - 0.5) * 0.05;
          positions[i * 3] = Math.cos(a) * r;
          positions[i * 3 + 1] = Math.sin(a) * r;
          positions[i * 3 + 2] = 0;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
          color, size, sizeAttenuation: true, transparent: true, opacity: 0.9,
          depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const pts = new THREE.Points(geo, mat);
        pts.rotation.x = tiltX;
        pts.rotation.z = tiltZ;
        holo.add(pts);
        return pts;
      }
      const particlesA = makeParticles(22, 1.3, Math.PI / 2.4, 0.15, NEON_GREEN, 0.05);
      const particlesB = makeParticles(26, 1.62, Math.PI / 2.1, -0.55, NEON_CYAN, 0.042);
      const particlesC = makeParticles(30, 1.94, Math.PI / 1.8, 1.1, NEON_VIOLET, 0.035);

      const glowGeo = new THREE.CircleGeometry(1.3, 48);
      const glowMat = new THREE.MeshBasicMaterial({ color: NEON_GREEN, transparent: true, opacity: 0.1 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -1.05;
      holo.add(glow);

      scene.add(new THREE.AmbientLight(0xffffff, 0.35));
      const key = new THREE.PointLight(NEON_CYAN, 1.4, 9);
      key.position.set(2, 2, 3);
      scene.add(key);

      const start = performance.now();
      let frameId = 0;
      const renderOnce = () => renderer.render(scene, camera);

      function tick(now: number) {
        const t = (now - start) / 1000;
        holo.rotation.y = t * 0.22;
        holo.position.y = Math.sin(t * 0.65) * 0.06;
        core.rotation.x = t * 0.3;
        core.rotation.y = t * 0.22;
        coreEdges.rotation.copy(core.rotation);
        ringVideo.rotation.z += 0.004;
        ringImage.rotation.z -= 0.0028;
        ringVoice.rotation.z += 0.002;
        particlesA.rotation.z += 0.004;
        particlesB.rotation.z -= 0.0028;
        particlesC.rotation.z += 0.002;
        innerLight.intensity = 1.8 + Math.sin(t * 2.4) * 0.6;
        renderOnce();
        frameId = requestAnimationFrame(tick);
      }

      if (reduced) {
        renderOnce();
      } else {
        frameId = requestAnimationFrame(tick);
      }

      function handleVisibility() {
        if (document.hidden) {
          cancelAnimationFrame(frameId);
        } else if (!reduced) {
          frameId = requestAnimationFrame(tick);
        }
      }
      document.addEventListener("visibilitychange", handleVisibility);

      cleanupFns.push(() => {
        cancelAnimationFrame(frameId);
        document.removeEventListener("visibilitychange", handleVisibility);
        coreGeo.dispose();
        coreMat.dispose();
        coreEdgesGeo.dispose();
        coreEdgeMat.dispose();
        [ringVideo, ringImage, ringVoice].forEach((r) => {
          r.geometry.dispose();
          (r.material as InstanceType<typeof THREE.Material>).dispose();
          r.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
              child.geometry?.dispose();
              const m = child.material as InstanceType<typeof THREE.Material> | undefined;
              m?.dispose();
            }
          });
        });
        [particlesA, particlesB, particlesC].forEach((p) => {
          p.geometry.dispose();
          (p.material as InstanceType<typeof THREE.Material>).dispose();
        });
        glowGeo.dispose();
        glowMat.dispose();
        renderer.dispose();
        renderer.domElement.parentNode?.removeChild(renderer.domElement);
      });
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  if (!supported) return null;

  return <div ref={containerRef} aria-hidden className="pointer-events-none" style={{ width: SIZE, height: SIZE }} />;
}
