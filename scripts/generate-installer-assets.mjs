import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, '..', 'build');
fs.mkdirSync(buildDir, { recursive: true });

// CRC32 helper for PNG encoding
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

function encodeRGBAtoPNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth 8
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter type None
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Signed distance to rounded box centered at (0,0) with half-extents (hx, hy) and corner radius r
function sdRoundedBox(px, py, hx, hy, r) {
  const qx = Math.abs(px) - hx + r;
  const qy = Math.abs(py) - hy + r;
  const outDist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inDist = Math.min(Math.max(qx, qy), 0);
  return outDist + inDist - r;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Render OpenFCAD icon at (size x size) in normalized [0..24] coordinates
function renderOpenFcadIconRGBA(size) {
  const buf = Buffer.alloc(size * size * 4);
  const aa = 24 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = ((x + 0.5) / size) * 24;
      const ny = ((y + 0.5) / size) * 24;

      // Badge: [1.5..22.5] -> center (12, 12), half-size 10.5, radius 4.6
      const dBadge = sdRoundedBox(nx - 12, ny - 12, 10.5, 10.5, 4.6);
      const badgeAlpha = clamp01(0.5 - dBadge / aa);

      if (badgeAlpha <= 0) continue;

      // Cobalt-to-cyan diagonal gradient (#0EA5E9 -> #1D4ED8)
      const gradT = clamp01(((nx - 1.5) + (ny - 1.5)) / 42);
      let r = lerp(14, 29, gradT);
      let g = lerp(165, 78, gradT);
      let b = lerp(233, 216, gradT);

      // Subtle inner border ring
      const borderMask = clamp01(1 - Math.abs(dBadge + 0.55) / (aa * 0.9));
      r = lerp(r, 125, borderMask * 0.35);
      g = lerp(g, 211, borderMask * 0.35);
      b = lerp(b, 252, borderMask * 0.35);

      // Geometric 'F' lettermark:
      // Vertical stem: x in [6.8, 9.7], y in [5.4, 18.6]
      // Top bar: x in [6.8, 17.4], y in [5.4, 8.15]
      // Mid bar: x in [6.8, 14.8], y in [10.8, 13.4]
      const dStem = sdRoundedBox(nx - 8.25, ny - 12.0, 1.45, 6.6, 0.35);
      const dTop = sdRoundedBox(nx - 12.1, ny - 6.775, 5.3, 1.375, 0.35);
      const dMid = sdRoundedBox(nx - 10.8, ny - 12.1, 4.0, 1.3, 0.35);
      const dF = Math.min(dStem, dTop, dMid);
      const fAlpha = clamp01(0.5 - dF / aa);

      r = lerp(r, 255, fAlpha);
      g = lerp(g, 255, fAlpha);
      b = lerp(b, 255, fAlpha);

      // Precision CAD node dot at (16.2, 16.5), radius 1.95
      const dDot = Math.hypot(nx - 16.2, ny - 16.5) - 1.95;
      const dotAlpha = clamp01(0.5 - dDot / aa);
      r = lerp(r, 186, dotAlpha);
      g = lerp(g, 230, dotAlpha);
      b = lerp(b, 253, dotAlpha);

      const idx = (y * size + x) * 4;
      buf[idx] = Math.round(r);
      buf[idx + 1] = Math.round(g);
      buf[idx + 2] = Math.round(b);
      buf[idx + 3] = Math.round(badgeAlpha * 255);
    }
  }
  return buf;
}

function buildMultiSizeIco(sizes) {
  const pngBuffers = sizes.map((s) => encodeRGBAtoPNG(s, s, renderOpenFcadIconRGBA(s)));
  const count = sizes.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4);

  let dataOffset = 6 + count * 16;
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const png = pngBuffers[i];
    const entryOffset = 6 + i * 16;
    header[entryOffset] = s >= 256 ? 0 : s;
    header[entryOffset + 1] = s >= 256 ? 0 : s;
    header[entryOffset + 2] = 0;
    header[entryOffset + 3] = 0;
    header.writeUInt16LE(1, entryOffset + 4); // Color planes
    header.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    header.writeUInt32LE(png.length, entryOffset + 8);
    header.writeUInt32LE(dataOffset, entryOffset + 12);
    dataOffset += png.length;
  }

  return Buffer.concat([header, ...pngBuffers]);
}

// Encode uncompressed 24-bit Windows BMP (bottom-up rows) required by NSIS
function encode24BitBMP(width, height, getPixelRGB) {
  const rowBytes = width * 3;
  const rowPadded = (rowBytes + 3) & ~3;
  const pixelDataSize = rowPadded * height;
  const fileSize = 54 + pixelDataSize;
  const buf = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0, 2, 'ascii');
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up
  buf.writeUInt16LE(1, 26); // planes
  buf.writeUInt16LE(24, 28); // 24-bit BGR
  buf.writeUInt32LE(0, 30); // BI_RGB
  buf.writeUInt32LE(pixelDataSize, 34);
  buf.writeInt32LE(2835, 38); // 72 DPI
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y++) {
    const bmpRow = height - 1 - y;
    const rowStart = 54 + bmpRow * rowPadded;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixelRGB(x, y);
      const p = rowStart + x * 3;
      buf[p] = b;
      buf[p + 1] = g;
      buf[p + 2] = r;
    }
  }
  return buf;
}

// 1. Generate build/icon.ico and build/icon.png
const icoBuf = buildMultiSizeIco([256, 128, 64, 48, 32, 16]);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);

const png512 = encodeRGBAtoPNG(512, 512, renderOpenFcadIconRGBA(512));
fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);

// 1b. Generate Apple macOS build/icon.icns (multi-resolution ICNS container)
function buildAppleIcns() {
  const entries = [
    { tag: 'icp4', size: 16 },
    { tag: 'icp5', size: 32 },
    { tag: 'icp6', size: 64 },
    { tag: 'ic07', size: 128 },
    { tag: 'ic08', size: 256 },
    { tag: 'ic09', size: 512 },
  ];
  const chunks = entries.map(({ tag, size }) => {
    const png = size === 512 ? png512 : encodeRGBAtoPNG(size, size, renderOpenFcadIconRGBA(size));
    const head = Buffer.alloc(8);
    head.write(tag, 0, 4, 'ascii');
    head.writeUInt32BE(8 + png.length, 4);
    return Buffer.concat([head, png]);
  });
  const totalLen = 8 + chunks.reduce((acc, c) => acc + c.length, 0);
  const fileHead = Buffer.alloc(8);
  fileHead.write('icns', 0, 4, 'ascii');
  fileHead.writeUInt32BE(totalLen, 4);
  return Buffer.concat([fileHead, ...chunks]);
}
fs.writeFileSync(path.join(buildDir, 'icon.icns'), buildAppleIcns());

// 1c. Generate macOS DMG background build/dmgBackground.png (540 x 380)
function buildDmgBackgroundPNG(width, height) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ty = y / height;
      let r = Math.round(lerp(22, 14, ty));
      let g = Math.round(lerp(30, 20, ty));
      let b = Math.round(lerp(42, 29, ty));

      // Subtle CAD blueprint grid
      if (x % 24 === 0 || y % 24 === 0) {
        r += 6;
        g += 10;
        b += 15;
      }
      // Top cobalt-cyan accent bar
      if (y < 4) {
        const tx = x / width;
        r = Math.round(lerp(14, 29, tx));
        g = Math.round(lerp(165, 78, tx));
        b = Math.round(lerp(233, 216, tx));
      }

      // Drop zones rings at (145, 190) and (395, 190)
      const dLeft = Math.hypot(x - 145, y - 190);
      const dRight = Math.hypot(x - 395, y - 190);
      if (Math.abs(dLeft - 56) < 1.2 || Math.abs(dRight - 56) < 1.2) {
        r = Math.round(lerp(r, 56, 0.4));
        g = Math.round(lerp(g, 189, 0.4));
        b = Math.round(lerp(b, 248, 0.4));
      }

      // Center drag arrow from x=230 to x=310 at y=190
      const inShaft = x >= 230 && x <= 292 && Math.abs(y - 190) <= 3.5;
      const headDx = 312 - x;
      const inHead = x >= 288 && x <= 312 && Math.abs(y - 190) <= headDx * 0.65;
      if (inShaft || inHead) {
        r = 56;
        g = 189;
        b = 248;
      }

      const idx = (y * width + x) * 4;
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }
  return encodeRGBAtoPNG(width, height, rgba);
}
fs.writeFileSync(path.join(buildDir, 'dmgBackground.png'), buildDmgBackgroundPNG(540, 380));

// 2. Generate build/installerSidebar.bmp (164 x 314) for NSIS wizard
const icon84 = renderOpenFcadIconRGBA(84);
const sidebarBmp = encode24BitBMP(164, 314, (x, y) => {
  // Left accent bar (4px cobalt-cyan gradient)
  if (x < 5) {
    const t = y / 314;
    return [Math.round(lerp(14, 29, t)), Math.round(lerp(165, 78, t)), Math.round(lerp(233, 216, t))];
  }
  // Dark CAD slate background with blueprint grid
  const vy = y / 314;
  let r = Math.round(lerp(20, 13, vy));
  let g = Math.round(lerp(28, 19, vy));
  let b = Math.round(lerp(38, 28, vy));

  if (x % 20 === 0 || y % 20 === 0) {
    r += 7;
    g += 11;
    b += 16;
  }
  if (x % 80 === 0 || y % 80 === 0) {
    r += 10;
    g += 18;
    b += 26;
  }

  // Decorative CAD technical circle & crosshair at bottom (center 84, 235)
  const distC = Math.hypot(x - 84, y - 235);
  if (Math.abs(distC - 44) < 1.1 || Math.abs(distC - 26) < 0.9) {
    r = Math.round(lerp(r, 56, 0.45));
    g = Math.round(lerp(g, 189, 0.45));
    b = Math.round(lerp(b, 248, 0.45));
  }
  if ((Math.abs(x - 84) < 0.8 && Math.abs(y - 235) < 54) || (Math.abs(y - 235) < 0.8 && Math.abs(x - 84) < 54)) {
    r = Math.round(lerp(r, 56, 0.35));
    g = Math.round(lerp(g, 189, 0.35));
    b = Math.round(lerp(b, 248, 0.35));
  }

  // Composite 84x84 OpenFCAD icon centered at top (x: 40..124, y: 38..122)
  const ix = x - 40;
  const iy = y - 38;
  if (ix >= 0 && ix < 84 && iy >= 0 && iy < 84) {
    const p = (iy * 84 + ix) * 4;
    const a = icon84[p + 3] / 255;
    if (a > 0) {
      r = Math.round(lerp(r, icon84[p], a));
      g = Math.round(lerp(g, icon84[p + 1], a));
      b = Math.round(lerp(b, icon84[p + 2], a));
    }
  }
  return [r, g, b];
});
fs.writeFileSync(path.join(buildDir, 'installerSidebar.bmp'), sidebarBmp);

// 3. Generate build/installerHeader.bmp (150 x 57) for NSIS wizard step headers
const icon40 = renderOpenFcadIconRGBA(40);
const headerBmp = encode24BitBMP(150, 57, (x, y) => {
  const tx = x / 150;
  let r = Math.round(lerp(22, 16, tx));
  let g = Math.round(lerp(30, 23, tx));
  let b = Math.round(lerp(41, 33, tx));
  if (x % 15 === 0 || y % 15 === 0) {
    r += 6;
    g += 10;
    b += 15;
  }
  if (y >= 54) {
    return [14, 165, 233];
  }
  const ix = x - 98;
  const iy = y - 8;
  if (ix >= 0 && ix < 40 && iy >= 0 && iy < 40) {
    const p = (iy * 40 + ix) * 4;
    const a = icon40[p + 3] / 255;
    if (a > 0) {
      r = Math.round(lerp(r, icon40[p], a));
      g = Math.round(lerp(g, icon40[p + 1], a));
      b = Math.round(lerp(b, icon40[p + 2], a));
    }
  }
  return [r, g, b];
});
fs.writeFileSync(path.join(buildDir, 'installerHeader.bmp'), headerBmp);

console.log('✓ Generated build/icon.ico, build/icon.icns, build/icon.png, build/dmgBackground.png, build/installerSidebar.bmp, build/installerHeader.bmp');
