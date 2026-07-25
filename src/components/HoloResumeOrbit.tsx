import { useEffect, useRef, useState } from "react";

// A small, self-animating holographic "identity badge" — orbited by rings
// and particles. Lazy-loads three.js (only used on this route), pauses when
// the tab is hidden, and renders a single static frame under reduced motion.

const SIZE = 340;
const GREEN = 0x2e5940;
const GREEN_BRIGHT = 0x4fae7e;
const CYAN = 0x6fbecb;

export function HoloResumeOrbit() {
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
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.25, 4.4);
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

      // Card — the "identity" at the center of the orbit
      const cardGeo = new THREE.BoxGeometry(1.7, 1.05, 0.045);
      const cardMat = new THREE.MeshPhysicalMaterial({
        color: 0x142019,
        transparent: true,
        opacity: 0.62,
        roughness: 0.25,
        metalness: 0.15,
        emissive: new THREE.Color(GREEN),
        emissiveIntensity: 0.35,
      });
      const card = new THREE.Mesh(cardGeo, cardMat);
      holo.add(card);

      const edgesGeo = new THREE.EdgesGeometry(cardGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: GREEN_BRIGHT, transparent: true, opacity: 0.9 });
      const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat);
      holo.add(edgeLines);

      const avatarGeo = new THREE.RingGeometry(0.16, 0.19, 32);
      const avatarMat = new THREE.MeshBasicMaterial({ color: GREEN_BRIGHT, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      const avatarRing = new THREE.Mesh(avatarGeo, avatarMat);
      avatarRing.position.set(-0.55, 0.25, 0.03);
      holo.add(avatarRing);

      const lineMat = new THREE.MeshBasicMaterial({ color: GREEN_BRIGHT, transparent: true, opacity: 0.55 });
      const lineGeos: InstanceType<typeof THREE.PlaneGeometry>[] = [];
      [0.5, 0.62, 0.38].forEach((w, i) => {
        const geo = new THREE.PlaneGeometry(w, 0.035);
        lineGeos.push(geo);
        const mesh = new THREE.Mesh(geo, lineMat);
        mesh.position.set(-0.85 + 0.12 + w / 2, 0.02 - i * 0.13, 0.03);
        holo.add(mesh);
      });

      function makeRing(radius: number, tube: number, tiltX: number, tiltZ: number, opacity: number, color: number) {
        const geo = new THREE.TorusGeometry(radius, tube, 8, 96);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = tiltX;
        mesh.rotation.z = tiltZ;
        holo.add(mesh);
        return mesh;
      }
      const ringA = makeRing(1.35, 0.006, Math.PI / 2.3, 0.3, 0.5, GREEN_BRIGHT);
      const ringB = makeRing(1.7, 0.005, Math.PI / 2.6, -0.5, 0.32, CYAN);

      function makeParticles(count: number, radius: number, tiltX: number, color: number, size: number) {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
          const r = radius + (Math.random() - 0.5) * 0.06;
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
        holo.add(pts);
        return pts;
      }
      const particlesA = makeParticles(26, 1.35, Math.PI / 2.3, GREEN_BRIGHT, 0.045);
      const particlesB = makeParticles(18, 1.7, Math.PI / 2.6, CYAN, 0.035);

      const glowGeo = new THREE.CircleGeometry(1.1, 48);
      const glowMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.12 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.85;
      holo.add(glow);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const key = new THREE.PointLight(GREEN_BRIGHT, 1.2, 8);
      key.position.set(1.5, 1.5, 2);
      scene.add(key);

      const start = performance.now();
      let frameId = 0;
      const renderOnce = () => renderer.render(scene, camera);

      function tick(now: number) {
        const t = (now - start) / 1000;
        holo.rotation.y = t * 0.28;
        holo.position.y = Math.sin(t * 0.7) * 0.05;
        ringA.rotation.z += 0.0035;
        ringB.rotation.z -= 0.002;
        particlesA.rotation.z += 0.0035;
        particlesB.rotation.z -= 0.002;
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
        cardGeo.dispose();
        cardMat.dispose();
        edgesGeo.dispose();
        edgeMat.dispose();
        avatarGeo.dispose();
        avatarMat.dispose();
        lineMat.dispose();
        lineGeos.forEach((g) => g.dispose());
        [ringA, ringB].forEach((r) => {
          r.geometry.dispose();
          (r.material as InstanceType<typeof THREE.Material>).dispose();
        });
        [particlesA, particlesB].forEach((p) => {
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
