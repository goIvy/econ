/**
 * Editorial plates for the hero gallery, drawn from our own colleges: the
 * college name set large in the display serif, the major and type beneath,
 * and a spray of rising paths. Decoration only; no figures are drawn.
 * Plates are 1400x400 to match the gallery's curved panel (arc 2pi*5*0.2 : height 1.8).
 */
export interface Plate {
  name: string;
  major: string;
  meta: string;
}

const TONES: Array<{ bg: string; ink: string; line: string; glow: string }> = [
  { bg: "#e9dccd", ink: "#2a1a10", line: "#c4531f", glow: "rgba(217,98,42,0.35)" },
  { bg: "#d9e2ee", ink: "#101a2a", line: "#3567c9", glow: "rgba(53,103,201,0.30)" },
  { bg: "#d8e6de", ink: "#0f2219", line: "#1a8a6e", glow: "rgba(26,138,110,0.30)" },
  { bg: "#1d1e23", ink: "#f4f1ea", line: "#f08a55", glow: "rgba(240,138,85,0.35)" },
  { bg: "#efe9e1", ink: "#1b1916", line: "#9a5bd0", glow: "rgba(154,91,208,0.25)" },
];

function seeded(text: string) {
  let s = [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483647, 7) || 7;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function drawPlates(plates: Plate[], serif: string, sans: string): string[] {
  return plates.map((p, i) => {
    const W = 1400;
    const H = 400;
    const tone = TONES[i % TONES.length];
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = tone.bg;
    ctx.fillRect(0, 0, W, H);
    // a soft light pool on the right
    const g = ctx.createRadialGradient(W * 0.78, H * 0.9, 10, W * 0.78, H * 0.9, W * 0.45);
    g.addColorStop(0, tone.glow);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // rising paths
    const rand = seeded(p.name + p.major);
    for (let k = 0; k < 26; k++) {
      let y = H * 0.92;
      let slope = -1.5 - rand() * 3.5;
      ctx.beginPath();
      ctx.moveTo(W * 0.45, y);
      for (let x = W * 0.45; x <= W + 20; x += 24) {
        slope += (rand() - 0.56) * 1.6;
        y = Math.max(20, Math.min(H - 10, y + slope));
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = tone.line;
      ctx.globalAlpha = 0.18 + rand() * 0.5;
      ctx.lineWidth = k % 6 === 0 ? 2.4 : 1.1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // type
    ctx.fillStyle = tone.ink;
    ctx.textBaseline = "alphabetic";
    ctx.font = `500 22px ${sans}`;
    ctx.globalAlpha = 0.7;
    ctx.fillText(`PATH ${String(i + 1).padStart(2, "0")}`, 56, 70);
    ctx.globalAlpha = 1;
    let size = 150;
    ctx.font = `400 ${size}px ${serif}`;
    while (ctx.measureText(p.name).width > W * 0.62 && size > 70) {
      size -= 6;
      ctx.font = `400 ${size}px ${serif}`;
    }
    ctx.fillText(p.name, 52, 250);
    ctx.font = `italic 400 54px ${serif}`;
    ctx.fillText(p.major, 56, 330);
    ctx.font = `500 22px ${sans}`;
    ctx.globalAlpha = 0.65;
    ctx.fillText(p.meta, 56, 372);
    ctx.globalAlpha = 1;
    return cv.toDataURL("image/webp", 0.9);
  });
}
