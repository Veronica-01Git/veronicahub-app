// Cena WebGL do holograma "YO" da hero. Fica separada do componente React
// para que o three.js (e o GLTFLoader) só entrem no bundle via import()
// dinâmico — a hero pinta o texto primeiro e o 3D chega depois.
//
// O .glb não traz animação própria: todo o movimento é procedural aqui
// (balanço do rig, órbitas girando no próprio plano, anel de varredura
// subindo pelo feixe, partículas em deriva e paralaxe do ponteiro).

export type HologramHandle = { dispose: () => void };

type Options = {
  src: string;
  reducedMotion: boolean;
  onReady?: () => void;
  onError?: () => void;
};

export async function mountHologram(
  container: HTMLElement,
  { src, reducedMotion, onReady, onError }: Options,
): Promise<HologramHandle> {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

  let renderer: InstanceType<typeof THREE.WebGLRenderer>;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    onError?.();
    return { dispose: () => {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);

  // Raiz que recebe a paralaxe do ponteiro; o rig do .glb fica dentro dela
  // com o seu próprio balanço — assim os dois movimentos não brigam.
  const stage = new THREE.Group();
  scene.add(stage);

  let disposed = false;
  let frame = 0;
  let running = false;
  const cleanups: Array<() => void> = [];

  const gltf = await new GLTFLoader().loadAsync(src).catch(() => null);
  if (!gltf) {
    renderer.dispose();
    renderer.domElement.remove();
    onError?.();
    return { dispose: () => {} };
  }

  const rig = gltf.scene.getObjectByName("avatar_hologram_rig") ?? gltf.scene;
  stage.add(gltf.scene);

  // Holograma é luz, não matéria: bordas, fios, partículas e feixe somam
  // brilho sobre o fundo escuro da hero em vez de se ocluírem.
  gltf.scene.traverse((obj) => {
    const mesh = obj as InstanceType<typeof THREE.Mesh>;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      m.depthWrite = false;
      if (!/shell/.test(m.name)) m.blending = THREE.AdditiveBlending;
    }
  });

  // As letras vêm viradas de lado no arquivo; mede a normal delas e gira o
  // rig até o "YO" encarar a câmera, sem depender do ângulo exportado.
  const letters = rig.getObjectByName("yo_letters");
  let baseYaw = 0;
  if (letters) {
    const e = letters.matrix.elements;
    baseYaw = -Math.atan2(e[8], e[10]);
  }

  // Órbitas: anel + conta giram juntos no plano do anel. Um pivô por órbita
  // preserva a inclinação original do grupo.
  const spins: Array<{ pivot: InstanceType<typeof THREE.Group>; speed: number }> = [];
  ["orbit_1", "orbit_2", "orbit_3"].forEach((name, i) => {
    const orbit = rig.getObjectByName(name);
    if (!orbit) return;
    const pivot = new THREE.Group();
    [...orbit.children].forEach((child) => pivot.add(child));
    orbit.add(pivot);
    spins.push({ pivot, speed: [0.32, -0.22, 0.16][i] });
  });

  const particles = rig.getObjectByName("particles");
  const scanRing = rig.getObjectByName("scan_ring");
  const scanBaseY = scanRing?.position.y ?? 0;
  const scanMats = collectMaterials(scanRing);
  const beamMats = collectMaterials(rig.getObjectByName("projection_beam"));
  const echoes = [1, 2, 3, 4].map((n) => collectMaterials(rig.getObjectByName(`yo_echo_${n}`)));
  const echoBase = echoes.map((mats) => mats.map((m) => m.opacity));
  const beamBase = beamMats.map((m) => m.opacity);
  const scanBase = scanMats.map((m) => m.opacity);

  // Enquadra pela esfera envolvente. As partículas soltas inflam o raio,
  // então a câmera chega mais perto do que a esfera inteira pediria: o
  // "YO" e as órbitas ocupam a coluna e só a poeira sangra pelas bordas.
  rig.rotation.y = baseYaw;
  const sphere = new THREE.Box3().setFromObject(gltf.scene).getBoundingSphere(new THREE.Sphere());
  gltf.scene.position.sub(sphere.center);
  const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 0.66;
  camera.position.set(0, sphere.radius * 0.16, dist);
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render(lastT);
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function onPointer(e: PointerEvent) {
    const r = container.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }

  let lastT = 0;
  function render(t: number) {
    lastT = t;
    const s = t / 1000;

    // Balanço lento em vez de giro completo: o "YO" nunca fica de perfil
    // nem espelhado, e os ecos gravados no arquivo leem como rastro.
    rig.rotation.y = baseYaw + Math.sin(s * 0.45) * 0.38;
    rig.position.y = Math.sin(s * 0.9) * 0.012;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    stage.rotation.y = pointer.x * 0.18;
    stage.rotation.x = pointer.y * 0.1;

    for (const { pivot, speed } of spins) pivot.rotation.z = s * speed;
    if (particles) particles.rotation.y = s * 0.05;

    if (scanRing) {
      const p = (s * 0.28) % 1;
      // Varre do pé do feixe (~0.01) até o topo das letras (~0.17), em
      // unidades do próprio arquivo.
      scanRing.position.y = scanBaseY - 0.06 + p * 0.16;
      const fade = Math.sin(p * Math.PI);
      scanMats.forEach((m, i) => (m.opacity = scanBase[i] * fade));
    }

    const flicker = 0.85 + 0.15 * Math.sin(s * 7.3) * Math.sin(s * 2.1);
    beamMats.forEach((m, i) => (m.opacity = beamBase[i] * flicker));
    echoes.forEach((mats, n) => {
      const wave = 0.55 + 0.45 * Math.sin(s * 1.6 - n * 0.7);
      mats.forEach((m, i) => (m.opacity = echoBase[n][i] * wave));
    });

    renderer.render(scene, camera);
  }

  function loop(t: number) {
    if (!running) return;
    render(t);
    frame = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reducedMotion || disposed) return;
    running = true;
    frame = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  cleanups.push(() => ro.disconnect());

  // Só anima enquanto a hero está na tela e a aba está visível.
  let inView = true;
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView && !document.hidden) start();
    else stop();
  });
  io.observe(container);
  cleanups.push(() => io.disconnect());

  const onVisibility = () => (document.hidden || !inView ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

  if (!reducedMotion) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    cleanups.push(() => window.removeEventListener("pointermove", onPointer));
  }

  resize();
  render(reducedMotion ? 1800 : 0);
  start();
  onReady?.();

  return {
    dispose() {
      disposed = true;
      stop();
      cleanups.forEach((fn) => fn());
      gltf.scene.traverse((obj) => {
        const mesh = obj as InstanceType<typeof THREE.Mesh>;
        mesh.geometry?.dispose();
        const mats = mesh.material
          ? Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          : [];
        mats.forEach((m) => m.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };

  // O GLTFLoader compartilha o mesmo material entre malhas (o anel de
  // varredura usa o material das órbitas). Clona antes de animar opacidade
  // para que o fade de um não apague o outro.
  function collectMaterials(root: { traverse: (fn: (o: unknown) => void) => void } | undefined) {
    const out: Array<InstanceType<typeof THREE.Material>> = [];
    root?.traverse((o) => {
      const mesh = o as InstanceType<typeof THREE.Mesh>;
      if (!mesh.material || Array.isArray(mesh.material)) return;
      const own = mesh.material.clone();
      own.transparent = true;
      mesh.material = own;
      out.push(own);
    });
    return out;
  }
}
