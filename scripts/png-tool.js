/**
 * Minimal dependency-free PNG decode/encode helper used to prepare app icons.
 * Handles 8-bit non-interlaced greyscale/RGB/greyscale+alpha/RGBA PNGs.
 */
const fs = require('fs');
const zlib = require('zlib');

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  CRC_TABLE = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c;
  }
  return CRC_TABLE;
}

function crc32(buf) {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Decode a PNG file into { width, height, data } where data is RGBA bytes. */
function decode(file) {
  const buf = fs.readFileSync(file);
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('Not a PNG');

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];
  let palette = null;
  let trns = null;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') {
      palette = Buffer.from(data);
    } else if (type === 'tRNS') {
      trns = Buffer.from(data);
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`Unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error('Interlaced PNG not supported');

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`Unsupported color type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = channels;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const f = raw[rp++];
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v;
      switch (filter) {
        case 0: v = f; break;
        case 1: v = f + a; break;
        case 2: v = f + b; break;
        case 3: v = f + ((a + b) >> 1); break;
        case 4: v = f + paeth(a, b, c); break;
        default: throw new Error(`Bad filter ${filter}`);
      }
      row[x] = v & 0xff;
    }
  }

  // Normalise everything to RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let r, g, b, a = 255;
    if (colorType === 0) {
      r = g = b = out[i];
    } else if (colorType === 2) {
      r = out[i * 3]; g = out[i * 3 + 1]; b = out[i * 3 + 2];
    } else if (colorType === 3) {
      const idx = out[i];
      r = palette[idx * 3]; g = palette[idx * 3 + 1]; b = palette[idx * 3 + 2];
      if (trns && idx < trns.length) a = trns[idx];
    } else if (colorType === 4) {
      r = g = b = out[i * 2]; a = out[i * 2 + 1];
    } else {
      r = out[i * 4]; g = out[i * 4 + 1]; b = out[i * 4 + 2]; a = out[i * 4 + 3];
    }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = a;
  }

  return { width, height, data: rgba };
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Encode RGBA (or RGB when alpha is false) to a PNG file. */
function encode(file, { width, height, data }, { alpha = true } = {}) {
  const channels = alpha ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = y * (stride + 1) + 1 + x * channels;
      raw[d] = data[s];
      raw[d + 1] = data[s + 1];
      raw[d + 2] = data[s + 2];
      if (alpha) raw[d + 3] = data[s + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  fs.writeFileSync(
    file,
    Buffer.concat([
      SIG,
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
}

/** Composite an RGBA image over a solid colour, returning an opaque image. */
function flatten(img, [br, bg, bb]) {
  const out = Buffer.alloc(img.data.length);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3] / 255;
    out[i * 4] = Math.round(img.data[i * 4] * a + br * (1 - a));
    out[i * 4 + 1] = Math.round(img.data[i * 4 + 1] * a + bg * (1 - a));
    out[i * 4 + 2] = Math.round(img.data[i * 4 + 2] * a + bb * (1 - a));
    out[i * 4 + 3] = 255;
  }
  return { width: img.width, height: img.height, data: out };
}

/** Box-sample resize. Good quality for downscaling, adequate for modest upscales. */
function resize(img, w, h) {
  const out = Buffer.alloc(w * h * 4);
  const xr = img.width / w;
  const yr = img.height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * yr);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * yr));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * xr);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * xr));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < Math.min(y1, img.height); sy++) {
        for (let sx = x0; sx < Math.min(x1, img.width); sx++) {
          const s = (sy * img.width + sx) * 4;
          const sa = img.data[s + 3] / 255;
          r += img.data[s] * sa; g += img.data[s + 1] * sa; b += img.data[s + 2] * sa;
          a += img.data[s + 3];
          n++;
        }
      }
      const d = (y * w + x) * 4;
      const alphaAvg = a / n;
      const wsum = (alphaAvg / 255) * n || 1;
      out[d] = Math.round(r / wsum);
      out[d + 1] = Math.round(g / wsum);
      out[d + 2] = Math.round(b / wsum);
      out[d + 3] = Math.round(alphaAvg);
    }
  }
  return { width: w, height: h, data: out };
}

module.exports = { decode, encode, flatten, resize };
