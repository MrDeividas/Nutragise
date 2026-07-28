/**
 * Prepares app icon assets from a single square source image.
 *
 * Apple masks app icons itself, so the source must be full-bleed with square
 * corners and no alpha channel. Artwork exported with rounded corners baked in
 * gets masked twice and shows dark wedges, so we detect the baked radius and
 * extend the artwork's edge pixels outward to square it back off.
 *
 * Usage: node scripts/build-icons.js <source.png>
 */
const path = require('path');
const { decode, encode } = require('./png-tool');

const SRC = process.argv[2];
if (!SRC) {
  console.error('Usage: node scripts/build-icons.js <source.png>');
  process.exit(1);
}

const ASSETS = path.join(__dirname, '..', 'assets');
const OUT_SIZE = 1024;
const EDGE_PAD = 6; // skip the soft antialiased outline on the straight edges
const ADAPTIVE_SCALE = 0.68; // Android only guarantees the centre ~66% stays visible
const SPLASH_SCALE = 0.5;

const src = decode(SRC);
const { width: W, height: H } = src;
if (W !== H) {
  console.error(`Source must be square, got ${W}x${H}`);
  process.exit(1);
}

const lumAt = (x, y) => {
  const i = (y * W + x) * 4;
  return src.data[i] * 0.299 + src.data[i + 1] * 0.587 + src.data[i + 2] * 0.114;
};

/**
 * Walk diagonally in from a corner until the colour changes. For a corner whose
 * rounding sits against contrasting artwork this is the rounding depth. Corners
 * backed by same-coloured artwork over-report, so callers take the minimum.
 */
function cornerDepth(cornerX, cornerY) {
  const sx = cornerX === 0 ? 1 : -1;
  const sy = cornerY === 0 ? 1 : -1;
  const start = lumAt(cornerX, cornerY);
  const limit = Math.floor(W * 0.35);
  for (let t = 0; t < limit; t++) {
    if (Math.abs(lumAt(cornerX + sx * t, cornerY + sy * t) - start) > 96) return t;
  }
  return 0;
}

const depths = {
  tl: cornerDepth(0, 0),
  tr: cornerDepth(W - 1, 0),
  bl: cornerDepth(0, H - 1),
  br: cornerDepth(W - 1, H - 1),
};

const measured = Object.values(depths).filter((d) => d > 0);
const depth = measured.length ? Math.min(...measured) : 0;
// Diagonal depth of a circular corner arc is R * (1 - 1/sqrt(2))
const R = depth > 0 ? Math.round(depth / (1 - 1 / Math.SQRT2)) : 0;
const sampleR = Math.max(0, R - Math.round(R * 0.07)); // sample inside the antialiased rim

console.log(`source         : ${path.basename(SRC)} (${W}x${H})`);
console.log(`corner depths  : TL ${depths.tl}  TR ${depths.tr}  BL ${depths.bl}  BR ${depths.br}`);
console.log(`baked radius   : ${R}px (${((R / W) * 100).toFixed(1)}% of width)`);

function bilinear(fx, fy) {
  const x0 = Math.max(0, Math.min(W - 1, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(H - 1, Math.floor(fy)));
  const x1 = Math.min(W - 1, x0 + 1);
  const y1 = Math.min(H - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const p00 = src.data[(y0 * W + x0) * 4 + c];
    const p10 = src.data[(y0 * W + x1) * 4 + c];
    const p01 = src.data[(y1 * W + x0) * 4 + c];
    const p11 = src.data[(y1 * W + x1) * 4 + c];
    out[c] = p00 * (1 - tx) * (1 - ty) + p10 * tx * (1 - ty) + p01 * (1 - tx) * ty + p11 * tx * ty;
  }
  return out;
}

/** Clamp a sample point inside the artwork, off the rounding and soft outline. */
function clampIntoArtwork(x, y) {
  const lo = EDGE_PAD;
  const hi = W - 1 - EDGE_PAD;
  let cx = Math.min(Math.max(x, lo), hi);
  let cy = Math.min(Math.max(y, lo), hi);

  if (R > 0) {
    const near = lo + R;
    const far = hi - R;
    let ax = null;
    let ay = null;
    if (cx < near && cy < near) { ax = near; ay = near; }
    else if (cx > far && cy < near) { ax = far; ay = near; }
    else if (cx < near && cy > far) { ax = near; ay = far; }
    else if (cx > far && cy > far) { ax = far; ay = far; }

    if (ax !== null) {
      const dx = cx - ax;
      const dy = cy - ay;
      const d = Math.hypot(dx, dy) || 1;
      if (d > sampleR) {
        cx = ax + (dx / d) * sampleR;
        cy = ay + (dy / d) * sampleR;
      }
    }
  }
  return [cx, cy];
}

const scale = W / OUT_SIZE;
const squared = { width: OUT_SIZE, height: OUT_SIZE, data: Buffer.alloc(OUT_SIZE * OUT_SIZE * 4) };
const SS = 2;
for (let y = 0; y < OUT_SIZE; y++) {
  for (let x = 0; x < OUT_SIZE; x++) {
    let r = 0, g = 0, b = 0;
    for (let oy = 0; oy < SS; oy++) {
      for (let ox = 0; ox < SS; ox++) {
        const [sx, sy] = clampIntoArtwork(
          (x + (ox + 0.5) / SS) * scale,
          (y + (oy + 0.5) / SS) * scale
        );
        const [pr, pg, pb] = bilinear(sx, sy);
        r += pr; g += pg; b += pb;
      }
    }
    const n = SS * SS;
    const d = (y * OUT_SIZE + x) * 4;
    squared.data[d] = Math.round(r / n);
    squared.data[d + 1] = Math.round(g / n);
    squared.data[d + 2] = Math.round(b / n);
    squared.data[d + 3] = 255;
  }
}

encode(path.join(ASSETS, 'icon.png'), squared, { alpha: false });
console.log('wrote          : assets/icon.png (1024x1024, opaque, no alpha)');

/** Area-downscale the squared icon and centre it on a full-size canvas. */
function inset(factor) {
  const size = Math.round(OUT_SIZE * factor);
  const offset = Math.round((OUT_SIZE - size) / 2);
  const canvas = { width: OUT_SIZE, height: OUT_SIZE, data: Buffer.alloc(OUT_SIZE * OUT_SIZE * 4) };
  const ratio = OUT_SIZE / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * ratio);
      const y0 = Math.floor(y * ratio);
      const x1 = Math.min(OUT_SIZE, Math.max(x0 + 1, Math.floor((x + 1) * ratio)));
      const y1 = Math.min(OUT_SIZE, Math.max(y0 + 1, Math.floor((y + 1) * ratio)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const s = (sy * OUT_SIZE + sx) * 4;
          r += squared.data[s]; g += squared.data[s + 1]; b += squared.data[s + 2];
          n++;
        }
      }
      const d = ((y + offset) * OUT_SIZE + (x + offset)) * 4;
      canvas.data[d] = Math.round(r / n);
      canvas.data[d + 1] = Math.round(g / n);
      canvas.data[d + 2] = Math.round(b / n);
      canvas.data[d + 3] = 255;
    }
  }
  return canvas;
}

encode(path.join(ASSETS, 'adaptive-icon.png'), inset(ADAPTIVE_SCALE), { alpha: true });
console.log(`wrote          : assets/adaptive-icon.png (artwork at ${Math.round(ADAPTIVE_SCALE * 100)}%)`);

encode(path.join(ASSETS, 'splash-icon.png'), inset(SPLASH_SCALE), { alpha: true });
console.log(`wrote          : assets/splash-icon.png (artwork at ${Math.round(SPLASH_SCALE * 100)}%)`);

/**
 * Android notification icons are drawn as a flat white mask using only the
 * alpha channel, so the source must be a transparent-backed silhouette.
 */
const NOTIF_SCALE = 0.78;
const notif = { width: OUT_SIZE, height: OUT_SIZE, data: Buffer.alloc(OUT_SIZE * OUT_SIZE * 4) };
const notifSize = Math.round(OUT_SIZE * NOTIF_SCALE);
const notifOffset = Math.round((OUT_SIZE - notifSize) / 2);
const notifRatio = OUT_SIZE / notifSize;
for (let y = 0; y < notifSize; y++) {
  for (let x = 0; x < notifSize; x++) {
    const x0 = Math.floor(x * notifRatio);
    const y0 = Math.floor(y * notifRatio);
    const x1 = Math.min(OUT_SIZE, Math.max(x0 + 1, Math.floor((x + 1) * notifRatio)));
    const y1 = Math.min(OUT_SIZE, Math.max(y0 + 1, Math.floor((y + 1) * notifRatio)));
    let cover = 0;
    let n = 0;
    for (let sy = y0; sy < y1; sy++) {
      for (let sx = x0; sx < x1; sx++) {
        const s = (sy * OUT_SIZE + sx) * 4;
        const l =
          squared.data[s] * 0.299 + squared.data[s + 1] * 0.587 + squared.data[s + 2] * 0.114;
        cover += l < 128 ? 1 : 0; // dark artwork becomes the visible silhouette
        n++;
      }
    }
    const d = ((y + notifOffset) * OUT_SIZE + (x + notifOffset)) * 4;
    notif.data[d] = 255;
    notif.data[d + 1] = 255;
    notif.data[d + 2] = 255;
    notif.data[d + 3] = Math.round((cover / n) * 255);
  }
}
encode(path.join(ASSETS, 'notification-icon.png'), notif, { alpha: true });
console.log('wrote          : assets/notification-icon.png (white silhouette, transparent bg)');
