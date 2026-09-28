/** Tiny chart geometry helpers shared by the interactive charts (no rendering). */

export type Scale = ((v: number) => number) & { invert: (px: number) => number; domain: [number, number]; range: [number, number] };

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = ((v: number) => r0 + (v - d0) * k) as Scale;
  f.invert = (px: number) => (k === 0 ? d0 : d0 + (px - r0) / k);
  f.domain = domain;
  f.range = range;
  return f;
}

/** Polyline path through points (the model is linear between year-ends, so the line is too). */
export function linePath(points: Array<[number, number]>): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
}

/** Closed area between a line and a baseline y. */
export function areaPath(points: Array<[number, number]>, baseY: number): string {
  if (points.length === 0) return "";
  return `${linePath(points)}L${points[points.length - 1][0].toFixed(1)},${baseY.toFixed(1)}L${points[0][0].toFixed(1)},${baseY.toFixed(1)}Z`;
}

/** Value of an evenly spaced series (one point per unit of x starting at x0) at fractional x. */
export function valueAt(series: ArrayLike<number>, x0: number, x: number): number {
  const n = series.length;
  if (n === 0) return 0;
  const t = x - x0;
  if (t <= 0) return series[0];
  if (t >= n - 1) return series[n - 1];
  const i = Math.floor(t);
  return series[i] + (series[i + 1] - series[i]) * (t - i);
}

/** "Nice" tick values across a domain. */
export function ticks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
