// A tiny SVG writer whose text is set as glyph outlines, so every chart renders the
// same on any OS, in GitHub's <img> sandbox, where web fonts cannot load.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import opentype from 'opentype.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const FONT_DIRS = [
  path.resolve(HERE, '../fonts'),
  path.join(os.homedir(), 'Library/Fonts'),
  '/usr/share/fonts/opentype/pretendard',
  '/usr/local/share/fonts',
];
const FONT_FILES = {
  400: 'Pretendard-Regular.otf',
  500: 'Pretendard-Medium.otf',
  600: 'Pretendard-SemiBold.otf',
  700: 'Pretendard-Bold.otf',
  brand: 'BricolageGrotesque-Bold.ttf',
  mono: 'MartianMono-StdRg.otf',
};

const cache = new Map();
export function font(weight) {
  if (!cache.has(weight)) {
    const file = FONT_FILES[weight];
    const dir = FONT_DIRS.find((d) => fs.existsSync(path.join(d, file)));
    if (!dir) throw new Error(`Font ${file} not found. Put it in tools/fonts/ (see tools/README.md).`);
    const f = opentype.loadSync(path.join(dir, file));
    f._kern = f.position.getKerningTables('latn') || f.position.defaultKerningTables;
    cache.set(weight, f);
  }
  return cache.get(weight);
}

function layout(str, weight, tracking = 0) {
  const f = font(weight);
  const glyphs = f.stringToGlyphs(str);
  const out = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    out.push({ g, x });
    x += g.advanceWidth + tracking * f.unitsPerEm;
    const next = glyphs[i + 1];
    if (next && f._kern) x += f.position.getKerningValue(f._kern, g.index, next.index) || 0;
  });
  return { f, out, width: x };
}

export function measure(str, size, weight = 400, tracking = 0) {
  const { f, width } = layout(String(str), weight, tracking);
  return (width * size) / f.unitsPerEm;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (n) => Math.round(n * 100) / 100;

export class Svg {
  constructor(width, height, { title, desc, css }) {
    Object.assign(this, { width, height, title, desc, css });
    this.body = [];
    this.defs = [];
    this.glyphs = new Map();
  }

  add(...parts) {
    this.body.push(...parts);
    return this;
  }

  // Text as <use> references to one outline per glyph; `cls` sets the fill.
  text(str, x, y, { size = 14, weight = 400, anchor = 'start', cls = 'ink', tracking = 0, extra = '' } = {}) {
    str = String(str);
    if (!str) return 0;
    const { f, out, width } = layout(str, weight, tracking);
    const scale = size / f.unitsPerEm;
    const w = width * scale;
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const uses = [];
    for (const { g, x: gx } of out) {
      if (!g.path || !g.path.commands.length) continue;
      const id = `g${String(weight)[0]}${g.index}`;
      if (!this.glyphs.has(id)) this.glyphs.set(id, g.getPath(0, 0, f.unitsPerEm).toPathData(0));
      uses.push(`<use href="#${id}" x="${Math.round(gx)}"/>`);
    }
    this.body.push(`<g class="${cls}" transform="translate(${r(x0)} ${r(y)}) scale(${r(scale * 10000) / 10000})"${extra}>${uses.join('')}</g>`);
    return w;
  }

  toString() {
    const glyphs = [...this.glyphs].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('');
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" role="img" aria-labelledby="t d">`,
      `<title id="t">${esc(this.title)}</title><desc id="d">${esc(this.desc)}</desc>`,
      `<style>${this.css}</style>`,
      `<defs>${glyphs}${this.defs.join('')}</defs>`,
      this.body.join(''),
      '</svg>',
    ].join('\n');
  }
}

// A bar that grows from its baseline with a 4px rounded data end.
export function hbar(x, y, w, h, cls, radius = 4) {
  if (w <= 0) return '';
  const rr = Math.min(radius, w, h / 2);
  return `<path class="${cls}" d="M${r(x)} ${r(y)}H${r(x + w - rr)}A${rr} ${rr} 0 0 1 ${r(x + w)} ${r(y + rr)}V${r(y + h - rr)}A${rr} ${rr} 0 0 1 ${r(x + w - rr)} ${r(y + h)}H${r(x)}Z"/>`;
}

export function rect(x, y, w, h, cls, rx = 0) {
  return `<rect class="${cls}" x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}"/>`;
}

export function line(x1, y1, x2, y2, cls) {
  return `<path class="${cls}" d="M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}"/>`;
}

export function circle(cx, cy, radius, cls) {
  return `<circle class="${cls}" cx="${r(cx)}" cy="${r(cy)}" r="${radius}"/>`;
}

export const fmt = (n, digits = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
