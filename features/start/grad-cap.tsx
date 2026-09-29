"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Procedural graduation cap, reconstructed with the img2threejs pipeline from a
 * single 3/4 reference (Fluent 3D emoji, MIT). Spec: .img2threejs/object-sculpt-spec.json.
 *
 * Build passes: blockout (board box + skullcap lathe) -> structure (tassel
 * assembly as a child of the board) -> form (chamfered board, flared rim, cord
 * drape) -> material (matte felt in brand ink, satin cord in the accent with a
 * gradient bullion) -> lighting (key / hemisphere fill / warm rim, ACES filmic,
 * soft contact shadow) -> interaction (idle float, pointer tilt, tassel sway,
 * "cap toss" on demand) -> optimization (paused off-screen, static under
 * reduced motion, everything disposed on unmount).
 *
 * Stylized, not exact: a single image cannot show the underside or the back.
 */
export function GradCap({ tossKey = 0, className, orbit = false }: { tossKey?: number; className?: string; orbit?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tossRef = useRef<(() => void) | null>(null);
  const firstToss = useRef(tossKey);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ------------------------------------------------------------ renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Reference camera: elevated ~28 deg, looking down at the board's 3/4 view.
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    // With the orbit the camera pulls back so the rings have room to sweep across the stage.
    if (orbit) {
      camera.position.set(0, 0.95, 4.0);
      camera.lookAt(0, 0.12, 0);
    } else {
      camera.position.set(0, 1.08, 2.85);
      camera.lookAt(0, 0.1, 0);
    }

    // ------------------------------------------------------------ materials
    const felt = new THREE.MeshStandardMaterial({ color: "#1d1e23", roughness: 0.78, metalness: 0 });
    const feltInner = new THREE.MeshStandardMaterial({ color: "#121316", roughness: 0.9, metalness: 0, side: THREE.BackSide });
    // Satin cord: a light clearcoat gives the soft silk highlight seen on the reference tassel.
    const satin = new THREE.MeshPhysicalMaterial({ color: "#e06a2b", roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.28 });
    const bullionMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.38, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.28 });

    // ------------------------------------------------------------ geometry
    const cap = new THREE.Group();
    scene.add(cap);

    // Board: 1.0 x 0.06 x 1.0, chamfer r 0.025 (3 segments), turned 45 deg (diamond in 3/4 view).
    const boardGroup = new THREE.Group();
    boardGroup.position.y = 0.3;
    boardGroup.rotation.y = Math.PI / 4;
    cap.add(boardGroup);
    const boardGeo = new RoundedBoxGeometry(1, 0.06, 1, 3, 0.025);
    const board = new THREE.Mesh(boardGeo, felt);
    boardGroup.add(board);

    // Skullcap: lathe profile, open top under the board, slight flare and rounded lower lip.
    const profile = [
      new THREE.Vector2(0.305, 0.27),
      new THREE.Vector2(0.325, 0.2),
      new THREE.Vector2(0.338, 0.1),
      new THREE.Vector2(0.342, 0.045),
      new THREE.Vector2(0.336, 0.012),
      new THREE.Vector2(0.318, 0.0),
      new THREE.Vector2(0.3, 0.004),
    ];
    const skullGeo = new THREE.LatheGeometry(profile, 64);
    const skull = new THREE.Mesh(skullGeo, felt);
    const skullInner = new THREE.Mesh(skullGeo, feltInner);
    cap.add(skull, skullInner);

    // Tassel assembly, parented to the board. Local +z points at the camera-facing edge
    // (the board is turned 45 deg), so the cord drapes over the front edge like the reference.
    const tassel = new THREE.Group();
    boardGroup.add(tassel);
    const buttonGeo = new THREE.SphereGeometry(0.036, 24, 12);
    const button = new THREE.Mesh(buttonGeo, satin);
    button.scale.set(1, 0.5, 1);
    button.position.set(0, 0.032, 0);
    tassel.add(button);

    const cordPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.036, 0),
      new THREE.Vector3(0.06, 0.042, 0.22),
      new THREE.Vector3(0.03, 0.04, 0.44),
      new THREE.Vector3(0.012, 0.03, 0.5),
      new THREE.Vector3(0.006, -0.02, 0.522),
    ]);
    const cordTopGeo = new THREE.TubeGeometry(cordPath, 48, 0.012, 10, false);
    tassel.add(new THREE.Mesh(cordTopGeo, satin));

    // The hanging part sways around the drape point at the board edge.
    const hang = new THREE.Group();
    hang.position.set(0.006, -0.02, 0.522);
    tassel.add(hang);
    const dropPath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.004, -0.12, 0), new THREE.Vector3(0.0, -0.22, 0)]);
    const cordDropGeo = new THREE.TubeGeometry(dropPath, 24, 0.012, 10, false);
    hang.add(new THREE.Mesh(cordDropGeo, satin));
    const headGeo = new THREE.SphereGeometry(0.03, 20, 14);
    const head = new THREE.Mesh(headGeo, satin);
    head.position.set(0, -0.23, 0);
    hang.add(head);
    const bullionProfile = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.024, -0.006),
      new THREE.Vector2(0.034, -0.05),
      new THREE.Vector2(0.046, -0.11),
      new THREE.Vector2(0.052, -0.15),
      new THREE.Vector2(0.036, -0.172),
      new THREE.Vector2(0.001, -0.178),
    ];
    const bullionGeo = new THREE.LatheGeometry(bullionProfile, 40);
    // Gradient: lighter at the head, deeper at the tip (reference yellow-orange to orange-red).
    const top = new THREE.Color("#f08a55");
    const tip = new THREE.Color("#c4531f");
    const pos = bullionGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.max(0, -pos.getY(i) / 0.178));
      c.copy(top).lerp(tip, t); // Color() already stores linear working-space values
      colors.set([c.r, c.g, c.b], i * 3);
    }
    bullionGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const bullion = new THREE.Mesh(bullionGeo, bullionMat);
    bullion.position.set(0, -0.245, 0);
    hang.add(bullion);

    // Contact shadow: a soft radial gradient on a plane (no shadow maps).
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d")!;
    const grad = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, "rgba(0,0,0,0.34)");
    grad.addColorStop(0.55, "rgba(0,0,0,0.12)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowGeo = new THREE.PlaneGeometry(1.05, 1.05);
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.2;
    scene.add(shadow);

    // ------------------------------------------------------------ orbit
    // Three tilted rings of glowing particles sweep around the cap, plus faint dust.
    // Points (one draw call per ring), soft round sprites, additive on dark.
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const spx = sprite.getContext("2d")!;
    const sg = spx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, "rgba(255,255,255,1)");
    sg.addColorStop(0.25, "rgba(255,255,255,0.75)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    spx.fillStyle = sg;
    spx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(sprite);
    const orbitGroup = new THREE.Group();
    orbitGroup.position.y = 0.16;
    orbitGroup.rotation.set(0.18, 0, 0.32);
    const rings: THREE.Points[] = [];
    const orbitGeos: THREE.BufferGeometry[] = [];
    const orbitMats: THREE.PointsMaterial[] = [];
    // Deterministic noise so the orbit looks the same on every visit.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
    const palette = [new THREE.Color("#eef2ff"), new THREE.Color("#ffffff"), new THREE.Color("#f08a55"), new THREE.Color("#ffd29a")];
    const makePoints = (count: number, place: (i: number, v: THREE.Vector3) => void, size: number) => {
      const positions = new Float32Array(count * 3);
      const cols = new Float32Array(count * 3);
      const v = new THREE.Vector3();
      const col = new THREE.Color();
      for (let i = 0; i < count; i++) {
        place(i, v);
        positions.set([v.x, v.y, v.z], i * 3);
        const r = rand();
        col.copy(palette[r < 0.55 ? 0 : r < 0.8 ? 1 : r < 0.93 ? 2 : 3]).multiplyScalar(0.45 + Math.pow(rand(), 3) * 1.6);
        cols.set([col.r, col.g, col.b], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      const mat = new THREE.PointsMaterial({ size, map: spriteTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      orbitGeos.push(geo);
      orbitMats.push(mat);
      return new THREE.Points(geo, mat);
    };
    if (orbit) {
      scene.add(orbitGroup);
      [
        { radius: 0.98, width: 0.045, count: 2600, size: 0.036 },
        { radius: 1.3, width: 0.1, count: 4200, size: 0.03 },
        { radius: 1.7, width: 0.06, count: 2600, size: 0.028 },
      ].forEach((band) => {
        const ring = makePoints(
          band.count,
          (_, v) => {
            const a = rand() * Math.PI * 2;
            // Denser, brighter arcs: bunch angles a little so the ring reads as streaks.
            const r = band.radius + gauss() * band.width + Math.sin(a * 3) * 0.03;
            v.set(Math.cos(a) * r, gauss() * 0.018, Math.sin(a) * r * 0.92);
          },
          band.size,
        );
        rings.push(ring);
        orbitGroup.add(ring);
      });
      const dust = makePoints(
        700,
        (_, v) => {
          v.set((rand() - 0.5) * 7, (rand() - 0.5) * 3.2, (rand() - 0.5) * 3 - 0.6);
        },
        0.012,
      );
      scene.add(dust);
      rings.push(dust);
    }

    // ------------------------------------------------------------ lighting
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(-2, 3, 2.5);
    const fill = new THREE.HemisphereLight("#ffffff", "#9a9ca3", 0.7);
    const rim = new THREE.DirectionalLight("#ffb286", 1.1);
    rim.position.set(2.2, 1.2, -2.5);
    scene.add(key, fill, rim);

    // ------------------------------------------------------------ theme
    const isDark = () => {
      const t = document.documentElement.dataset.theme;
      return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    };
    const applyTheme = () => {
      const dark = isDark();
      felt.color.set(dark ? "#2b2d34" : "#1d1e23");
      feltInner.color.set(dark ? "#1b1c21" : "#121316");
      rim.intensity = dark ? 2.0 : 1.1;
      fill.intensity = dark ? 0.9 : 0.7;
      shadowMat.opacity = dark ? 0.9 : 0.45;
      // Light theme: glowing (additive) points vanish on a pale ground, so draw them as ember ink.
      orbitMats.forEach((m) => {
        m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        m.color.set(dark ? "#ffffff" : "#c4531f");
        m.opacity = dark ? 1 : 0.75;
        m.needsUpdate = true;
      });
    };
    applyTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyTheme);
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // ------------------------------------------------------------ size
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ------------------------------------------------------------ interaction
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let tossStart = -1;
    tossRef.current = () => {
      tossStart = performance.now();
    };

    const base = { yaw: -0.35, pitch: 0.05 };
    const start = performance.now();
    let visible = true;
    let raf = 0;
    let sway = 0;
    let swayVel = 0;
    let lastYaw = base.yaw;

    const renderFrame = () => {
      const t = (performance.now() - start) / 1000;
      let lift = Math.sin(t * 1.1) * 0.025;
      let spin = 0;
      let flip = 0;
      if (tossStart > 0) {
        const p = Math.min(1, (performance.now() - tossStart) / 1300);
        // A short arc that stays inside the frame, one full turn and a little flip.
        lift += Math.sin(p * Math.PI) * 0.24;
        spin = (1 - Math.pow(1 - p, 3)) * Math.PI * 2;
        flip = Math.sin(p * Math.PI) * 0.35;
        if (p >= 1) tossStart = -1;
      }
      const targetYaw = base.yaw + pointer.x * 0.35 + Math.sin(t * 0.35) * 0.12 + spin;
      const targetPitch = base.pitch + pointer.y * 0.12 + flip;
      cap.rotation.y += (targetYaw - cap.rotation.y) * 0.06;
      cap.rotation.x += (targetPitch - cap.rotation.x) * 0.06;
      cap.position.y = lift;
      shadow.scale.setScalar(1 - lift * 0.6);
      // Tassel: damped spring driven by the cap's yaw velocity plus a gentle idle.
      const yawVel = cap.rotation.y - lastYaw;
      lastYaw = cap.rotation.y;
      swayVel += (-sway * 0.08 - swayVel * 0.12) + yawVel * 0.9;
      sway += swayVel;
      // The drop hangs off the +z edge: swing around x (toward/away) and z (side to side).
      hang.rotation.x = sway + Math.sin(t * 1.6) * 0.04;
      hang.rotation.z = Math.sin(t * 1.2) * 0.05;
      if (orbit) {
        // Rings turn at different speeds (inner fastest); the whole orbit leans toward the pointer.
        rings[0].rotation.y = t * 0.32;
        rings[1].rotation.y = -t * 0.2;
        rings[2].rotation.y = t * 0.12;
        rings[3].rotation.y = t * 0.02;
        orbitGroup.rotation.x += (0.18 + pointer.y * 0.08 - orbitGroup.rotation.x) * 0.04;
        orbitGroup.rotation.z += (0.32 - pointer.x * 0.08 - orbitGroup.rotation.z) * 0.04;
      }
      renderer.render(scene, camera);
    };

    const loop = () => {
      raf = 0;
      if (!visible) return;
      renderFrame();
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(mount);

    if (reduce) {
      cap.rotation.set(base.pitch, base.yaw, 0);
      rings.forEach((r, i) => (r.rotation.y = i * 0.9));
      renderer.render(scene, camera);
      const rerender = () => renderer.render(scene, camera);
      themeObserver.disconnect();
      const staticTheme = new MutationObserver(() => {
        applyTheme();
        rerender();
      });
      staticTheme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      mq.addEventListener("change", rerender);
      ro.disconnect();
      const ro2 = new ResizeObserver(() => {
        resize();
        rerender();
      });
      ro2.observe(mount);
      return () => {
        staticTheme.disconnect();
        mq.removeEventListener("change", rerender);
        ro2.disconnect();
        cleanup();
      };
    }

    function cleanup() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      mq.removeEventListener("change", applyTheme);
      window.removeEventListener("pointermove", onPointer);
      [boardGeo, skullGeo, buttonGeo, cordTopGeo, cordDropGeo, headGeo, bullionGeo, shadowGeo].forEach((g) => g.dispose());
      [felt, feltInner, satin, bullionMat, shadowMat, ...orbitMats].forEach((m) => m.dispose());
      orbitGeos.forEach((g) => g.dispose());
      shadowTex.dispose();
      spriteTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      tossRef.current = null;
    }
    return cleanup;
  }, [orbit]);

  // A new tossKey (e.g. after "See my college path") throws the cap.
  useEffect(() => {
    if (tossKey !== firstToss.current) tossRef.current?.();
  }, [tossKey]);

  return <div ref={mountRef} className={className} aria-hidden />;
}
