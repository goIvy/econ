"use client";

/*
 * ThreeUI <Gallery /> (MIT, @designcodeio/threeui 1.2.0, src/shaders/gallery/Gallery.tsx),
 * kept source-exact on its authored runtime (Three.js r149): sixteen curved panels
 * on a vertical cylindrical rail over the paper grid, with the same speed / scale /
 * opacity / colour props, visibility pausing and reduced-motion still frame.
 *
 * Two adaptations for this site: `images` replaces the five bundled photographs
 * (fashion and wedding imagery that has nothing to do with college costs) with
 * plates drawn from our own colleges, and each panel's inside face uses a
 * mirrored copy of its texture so the type on the plates never reads backwards.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import * as S from "three149";

export const GALLERY_DEFAULTS = { speed: 1, scale: 1, opacity: 1, hue: 0, saturation: 1, brightness: 1 } as const;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function CollegeGallery({
  images,
  speed = GALLERY_DEFAULTS.speed,
  scale = GALLERY_DEFAULTS.scale,
  opacity = GALLERY_DEFAULTS.opacity,
  hue = GALLERY_DEFAULTS.hue,
  saturation = GALLERY_DEFAULTS.saturation,
  brightness = GALLERY_DEFAULTS.brightness,
  className = "",
  style,
}: {
  images: string[];
  speed?: number;
  scale?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ speed, scale });
  // Live speed/scale are read by the render loop without restarting it.
  useEffect(() => {
    live.current = { speed, scale };
  }, [speed, scale]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || images.length === 0) return;
    const renderer = new S.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0, 0);
    renderer.outputEncoding = S.sRGBEncoding;
    const scene = new S.Scene();
    const camera = new S.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 18;
    const group = new S.Group();
    scene.add(group);
    const geometry = new S.CylinderGeometry(5, 5, 1.8, 64, 1, true, 0, Math.PI * 0.4);
    const loader = new S.TextureLoader();
    let disposed = false;
    let raf = 0;
    let t = 0;
    let last = 0;
    let inView = true;
    let pageVisible = !document.hidden;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const textures = images.map((src) => {
      const tex = loader.load(src, () => {
        if (disposed) {
          tex.dispose();
          return;
        }
        renderer.render(scene, camera);
      });
      tex.encoding = S.sRGBEncoding;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return tex;
    });
    // Plates carry type, so the inside face gets a mirrored copy of the texture and
    // reads the right way round (the authored DoubleSide material mirrors it there).
    const flipped = textures.map((tex: { clone: () => { wrapS: number; repeat: { x: number }; offset: { x: number }; needsUpdate: boolean } }) => {
      const f = tex.clone();
      f.wrapS = S.RepeatWrapping;
      f.repeat.x = -1;
      f.offset.x = 1;
      f.needsUpdate = true;
      return f;
    });
    const materials: Array<{ dispose: () => void }> = [];
    for (let i = 0; i < 16; i++) {
      const outer = new S.MeshBasicMaterial({ map: textures[i % textures.length], opacity: 0.85, side: S.FrontSide, toneMapped: false, transparent: true });
      const inner = new S.MeshBasicMaterial({ map: flipped[i % flipped.length], opacity: 0.85, side: S.BackSide, toneMapped: false, transparent: true });
      materials.push(outer, inner);
      for (const m of [outer, inner]) {
        const mesh = new S.Mesh(geometry, m);
        mesh.position.y = (i - 8) * 2.4;
        mesh.rotation.y = (i / 16) * Math.PI * 4;
        group.add(mesh);
      }
    }
    const frame = (now = performance.now()) => {
      const sp = clamp(live.current.speed, 0, 3);
      const sc = clamp(live.current.scale, 0.7, 1.35);
      if (last) t += Math.min((now - last) / 1000, 0.05) * sp;
      last = now;
      group.rotation.y = t * 0.18;
      group.position.y = Math.sin(t) * 1.5;
      group.scale.setScalar(sc);
      renderer.render(scene, camera);
    };
    const loop = (now: number) => {
      if (disposed || !inView || !pageVisible) {
        raf = 0;
        last = 0;
        return;
      }
      frame(now);
      raf = window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce) {
        frame(0);
        return;
      }
      if (!raf && inView && pageVisible) raf = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const resize = () => {
      const r = root.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      frame();
    };
    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver(([e]) => {
      inView = e?.isIntersecting ?? true;
      if (inView) start();
      else stop();
    });
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };
    ro.observe(root);
    io.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    start();
    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      group.clear();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      [...textures, ...flipped].forEach((x: { dispose: () => void }) => x.dispose());
      renderer.dispose();
    };
  }, [images]);

  return (
    <div ref={rootRef} className={`threeui-background gallery${className ? ` ${className}` : ""}`} data-mode="light" role="img" aria-label="Rotating gallery of college paths" style={style}>
      <canvas
        ref={canvasRef}
        className="gallery__canvas"
        aria-hidden="true"
        style={{
          opacity: clamp(opacity, 0.05, 1),
          filter: `hue-rotate(${clamp(hue, -180, 180)}deg) saturate(${clamp(saturation, 0, 2)}) brightness(${clamp(brightness, 0.35, 1.65)})`,
        }}
      />
    </div>
  );
}
