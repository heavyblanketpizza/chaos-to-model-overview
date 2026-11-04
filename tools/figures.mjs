// Renders the banner, the pipeline diagram, the timeline and the "follow one number" story.
//   cd tools && npm install && node figures.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Svg, measure, hbar, rect, line, circle } from './lib/svg.mjs';
import { THEMES, css } from './lib/theme.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const W = 880;
const PAD = 32;

// Greedy word wrap against the real glyph advances.
function wrap(text, size, weight, width) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && measure(next, size, weight) > width) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function paragraph(svg, text, x, y, { size = 13, weight = 400, width, lh = 19, cls = 'ink2' }) {
  const lines = wrap(text, size, weight, width);
  lines.forEach((l, i) => svg.text(l, x, y + i * lh, { size, weight, cls }));
  return y + lines.length * lh;
}

function arrow(x1, y1, x2, y2, cls = 'smut') {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 6;
  const p = (da) => `${(x2 - h * Math.cos(a + da)).toFixed(1)} ${(y2 - h * Math.sin(a + da)).toFixed(1)}`;
  return `<path class="${cls}" d="M${x1} ${y1}L${x2} ${y2}M${p(0.5)}L${x2} ${y2}L${p(-0.5)}"/>`;
}

function stepBadge(svg, n, x, y) {
  svg.add(circle(x + 11, y - 5, 11, 'c2m'));
  svg.text(String(n), x + 11, y, { size: 12.5, weight: 700, cls: 'sf', anchor: 'middle' });
}

// ---------- pipeline ----------

function pipeline(theme) {
  const H = 420;
  const stages = [
    ['Ingest', 'Hash and keep every original. Parsers run in a macOS sandbox, so a hostile file stays contained.'],
    ['Read', 'Layout-aware parsing. Hard pages are re-read by vision OCR; when readers disagree, a person decides.'],
    ['Curate', 'Repair Korean line breaks and tables, group editions into works, find duplicates, flag personal data.'],
    ['Generate', 'Grounded Q&A, rephrases and preference pairs from a local model, each checked against its passage.'],
    ['Export', 'A rights profile decides what ships: Parquet shards, dataset card, lineage and a signed manifest.'],
    ['Measure', 'Tune a small student on the export and score it on works it never saw, at a fixed budget.'],
  ];
  const svg = new Svg(W, H, {
    title: 'How Chaos-to-Model works',
    desc: 'Six stages on one Mac. ' + stages.map(([n, d], i) => `${i + 1}. ${n}: ${d}`).join(' ') +
      ' Lineage travels with every row: source file hash, page, box, and every step and model that touched it.',
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  const gx = 24;
  const cw = (W - PAD * 2 - gx * 2) / 3;
  const ch = 128;
  const rows = [PAD, PAD + ch + 28];
  stages.forEach(([name, desc], i) => {
    const col = i % 3;
    const x = PAD + col * (cw + gx);
    const y = rows[Math.floor(i / 3)];
    svg.add(rect(x, y, cw, ch, 'trk', 12));
    stepBadge(svg, i + 1, x + 16, y + 34);
    svg.text(name, x + 46, y + 34, { size: 17, weight: 600 });
    paragraph(svg, desc, x + 16, y + 62, { width: cw - 32, size: 13, lh: 19 });
    if (col < 2) svg.add(arrow(x + cw + 4, y + ch / 2, x + cw + gx - 4, y + ch / 2));
  });
  // Row 1 hands over to row 2.
  const r1 = rows[0] + ch;
  const r2 = rows[1];
  const xr = PAD + 2 * (cw + gx) + cw / 2;
  const xl = PAD + cw / 2;
  svg.add(`<path class="smut" d="M${xr} ${r1 + 4}V${r1 + 14}H${xl}V${r2 - 4}"/>`, arrow(xl, r2 - 12, xl, r2 - 4));
  // The lineage rail under everything.
  const ry = rows[1] + ch + 28;
  svg.add(rect(PAD, ry, W - PAD * 2, 56, 'pill', 28));
  svg.add(circle(PAD + 28, ry + 28, 6, 'c2m'));
  for (let i = 0; i < 6; i++) svg.add(circle(PAD + 60 + i * 9, ry + 28, 1.6, 'c2m'));
  svg.text('Lineage travels with every row', PAD + 124, ry + 25, { size: 14, weight: 600, cls: 'pillInk' });
  svg.text('source SHA-256 · page · box on the page · every step, tool version and model that touched it', PAD + 124, ry + 43, { size: 12.5, cls: 'pillInk' });
  return svg;
}

// ---------- timeline ----------

function timeline(theme) {
  const H = 318;
  const items = [
    ['Oct 7', 'First commit', true],
    ['Oct 8', 'Lineage-carrying tables, curation, export', true],
    ['Oct 9', 'Rights vocabulary, grounded synthesis, sandboxed parsers', true],
    ['Oct 10', 'Judge and proxy-student loop', true],
    ['Nov 1', '12-file Korean, English and French corpus', true],
    ['Nov 2', 'Vision OCR escalation, Korean PDF repairs', true],
    ['Nov 3', 'Unsloth and NeMo Curator baselines, signed export', true],
    ['Nov 3', 'Evaluation protocol committed before any run', true],
    ['Nov 4', 'Figures stage; 5 of 6 folds scored', true],
    ['Next', 'Fold 6, seeds 1-2, judge calibration, external pilot', false],
  ];
  const svg = new Svg(W, H, {
    title: 'Progress since the first commit',
    desc: items.map(([d, t]) => `${d}: ${t}`).join('. ') + '.',
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  svg.text('Four weeks, from first commit to a pre-registered benchmark', PAD, 50, { size: 19, weight: 600 });
  svg.text('Built on one M3 Max. Dates are 2026, Korea time.', PAD, 74, { size: 13.5, cls: 'ink2' });
  const y = 186;
  const x0 = PAD + 40;
  const x1 = W - PAD - 40;
  const step = (x1 - x0) / (items.length - 1);
  const lastDone = x0 + step * (items.length - 2);
  svg.add(`<path class="sc2m" d="M${x0} ${y}H${lastDone}"/>`);
  svg.add(`<path class="smut" stroke-dasharray="2 5" d="M${lastDone} ${y}H${x1}"/>`);
  items.forEach(([d, t, done], i) => {
    const x = x0 + i * step;
    svg.add(done ? `<circle class="c2m ring" cx="${x}" cy="${y}" r="6"/>` : `<circle class="hollow sc2m" cx="${x}" cy="${y}" r="5"/>`);
    const up = i % 2 === 0;
    const lines = wrap(t, 12, 400, i === items.length - 1 ? 112 : 150).slice(0, 3);
    const block = 16 + lines.length * 16;
    const top = up ? y - 22 - block : y + 30;
    svg.add(line(x, up ? y - 10 : y + 10, x, up ? y - 18 : y + 18, 'axis'));
    svg.text(d, x, top + 12, { size: 12.5, weight: 600, cls: done ? 'ink' : 'mut', anchor: 'middle' });
    lines.forEach((l, j) => svg.text(l, x, top + 30 + j * 16, { size: 12, cls: 'ink2', anchor: 'middle' }));
  });
  return svg;
}

// ---------- follow one number ----------

function embed(file) {
  return `data:image/jpeg;base64,${fs.readFileSync(path.join(ROOT, 'assets/stills', file)).toString('base64')}`;
}

function story(theme) {
  const H = 806;
  const svg = new Svg(W, H, {
    title: 'Follow one number',
    desc:
      'Step 1: page 14 of a scanned 310-page Korean rose guide shows a table whose 2019 cultivated area is 247 hectares. ' +
      'Step 2: c2m parses the table into rows and keeps its source: the file hash, page 14, the box on the page, and the steps ingest, parse and flatten. ' +
      'Step 3: a generated training question asks what 차광재배 means; the answer, 볕가림 가꾸기, cites the glossary on page 301 and passed 10 of 10 checks. ' +
      'Step 4: the research export containing it holds 377 SFT, 70 preference and 140 RL rows, and c2m verify confirms all 17 signed files.',
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  svg.text('Follow one number', PAD, 52, { size: 21, weight: 600 });
  svg.text('A Korean rose guide with no text layer: every page is an image. The 2019 cultivated area, 247 ha,', PAD, 78, { size: 14, cls: 'ink2' });
  svg.text('goes from scan to signed training set without losing its way back.', PAD, 99, { size: 14, cls: 'ink2' });

  // 1. The page.
  let y = 146;
  stepBadge(svg, 1, PAD, y);
  svg.text('The page', PAD + 32, y, { size: 15, weight: 600 });
  svg.text('PDF page 14 of 310 · printed page 12 · image only', W - PAD, y, { size: 12.5, cls: 'mut', anchor: 'end' });
  const iw = W - PAD * 2;
  const ih = Math.round((iw * 390) / 1632);
  const iy = y + 16;
  svg.defs.push(`<clipPath id="pg"><rect x="${PAD}" y="${iy}" width="${iw}" height="${ih}" rx="10"/></clipPath>`);
  svg.add(`<image href="${embed('rose-p14-table.jpg')}" x="${PAD}" y="${iy}" width="${iw}" height="${ih}" clip-path="url(#pg)" preserveAspectRatio="xMidYMid slice"/>`);
  svg.add(`<rect x="${PAD}" y="${iy}" width="${iw}" height="${ih}" rx="10" fill="none" class="axis"/>`);
  // The 247 cell sits at crop (1627..1803, 180..255) of 1840x440, scaled to the frame.
  const sx = iw / 1840;
  const sy = ih / 440;
  const cx = PAD + 1622 * sx;
  const cyy = iy + 176 * sy;
  svg.add(`<rect class="sc2m" style="stroke-width:2.5" x="${cx.toFixed(1)}" y="${cyy.toFixed(1)}" width="${(186 * sx).toFixed(1)}" height="${(84 * sy).toFixed(1)}" rx="6"/>`);

  // 2. The parsed table, 3. the training row.
  y = iy + ih + 52;
  const cw = (W - PAD * 2 - 24) / 2;
  const ch = 286;
  const lx = PAD;
  const rx = PAD + cw + 24;
  for (const x of [lx, rx]) svg.add(rect(x, y - 30, cw, ch, 'trk', 12));
  stepBadge(svg, 2, lx + 16, y);
  svg.text('The parsed table keeps its place', lx + 48, y, { size: 15, weight: 600 });
  stepBadge(svg, 3, rx + 16, y);
  svg.text('A training row cites its page', rx + 48, y, { size: 15, weight: 600 });

  const cols = [lx + 16, lx + 196, lx + 262, lx + 328];
  const table = [
    ['구분', '2015년', '2018년', '2019년'],
    ['재배면적(ha)', '306', '282', '247'],
    ['생산량(백만 본)', '144', '123', '105'],
    ['생산액(십억 원)', '68', '52', '50'],
  ];
  let ty = y + 36;
  svg.text('… 1995–2010 columns kept too', cols[0], ty - 2, { size: 11.5, cls: 'mut' });
  ty += 22;
  table.forEach((row, i) => {
    if (i === 1) svg.add(rect(lx + 8, ty - 17, cw - 16, 24, 'pill', 6));
    row.forEach((cell, j) => {
      const isHit = i === 1 && j === 3;
      const cls = i === 0 ? 'mut' : isHit ? 'pillInk' : i === 1 ? 'pillInk' : 'ink';
      const right = j === 0 ? null : cols[j] + 44;
      svg.text(cell, j === 0 ? cols[0] : right, ty, { size: 13, weight: isHit ? 700 : i === 0 ? 500 : 400, cls, anchor: j === 0 ? 'start' : 'end' });
    });
    ty += 28;
  });
  ty += 6;
  svg.add(line(lx + 16, ty - 14, lx + cw - 16, ty - 14, 'axis'));
  const lineage = [
    ['source', 'sha256 6a5066d5…c3a949'],
    ['page', '14 · box 38.8, 517.3 → 397.5, 581.0 pt'],
    ['steps', 'ingest → parse → flatten'],
  ];
  lineage.forEach(([k, v], i) => {
    svg.text(k, lx + 16, ty + 8 + i * 22, { size: 12, cls: 'mut' });
    svg.text(v, lx + 80, ty + 8 + i * 22, { size: 12.5, weight: 500, cls: 'ink' });
  });

  let qy = y + 40;
  svg.text('Q', rx + 16, qy, { size: 13, weight: 700, cls: 'c2m' });
  svg.text('차광재배는 어떤 관리 방식인가?', rx + 40, qy, { size: 14, weight: 600 });
  svg.text('What kind of practice is 차광재배?', rx + 40, qy + 20, { size: 12.5, cls: 'mut' });
  qy += 50;
  svg.text('A', rx + 16, qy, { size: 13, weight: 700, cls: 'c2m' });
  svg.text('볕가림 가꾸기', rx + 40, qy, { size: 14, weight: 600 });
  svg.text('Growing under shade', rx + 40, qy + 20, { size: 12.5, cls: 'mut' });
  const gy = qy + 38;
  const gw = cw - 32;
  const gs = gw / 760;
  // Show source rows 8..142 of the 250px crop: 차광 and 차광재배.
  const top = 8;
  const gh = Math.round((142 - top) * gs);
  svg.defs.push(`<clipPath id="gl"><rect x="${rx + 16}" y="${gy}" width="${gw}" height="${gh}" rx="8"/></clipPath>`);
  svg.add(`<image href="${embed('rose-p301-glossary.jpg')}" x="${rx + 16}" y="${(gy - top * gs).toFixed(1)}" width="${gw}" height="${(250 * gs).toFixed(1)}" clip-path="url(#gl)"/>`);
  svg.add(`<rect x="${rx + 16}" y="${gy}" width="${gw}" height="${gh}" rx="8" fill="none" class="axis"/>`);
  svg.add(`<rect class="sc2m" style="stroke-width:2" x="${rx + 16 + 4}" y="${(gy + (78 - top) * gs).toFixed(1)}" width="${gw - 8}" height="${(58 * gs).toFixed(1)}" rx="5"/>`);
  svg.text('source  PDF page 301, glossary · split  train · checks  10 / 10', rx + 16, gy + gh + 24, { size: 12, cls: 'mut' });

  // 4. The signed export.
  y = y - 30 + ch + 24;
  svg.add(rect(PAD, y, W - PAD * 2, 64, 'pill', 12));
  stepBadge(svg, 4, PAD + 16, y + 38);
  svg.text('The export is signed', PAD + 48, y + 38, { size: 15, weight: 600, cls: 'pillInk' });
  svg.text('research / bb21256d · SFT 377 rows · preference 70 · RL 140', PAD + 232, y + 38, { size: 13, cls: 'pillInk' });
  svg.text('c2m verify  ✓ 17 files', W - PAD - 18, y + 38, { size: 13, weight: 600, cls: 'pillInk', anchor: 'end' });
  svg.text('Page images: Rural Development Administration, 농업기술길잡이 120 「장미」. Rows and lineage shown as exported.', PAD, H - 22, { size: 12, cls: 'mut' });
  return svg;
}

// ---------- banner ----------

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function hero(theme, { width = W, height = 300, still = false } = {}) {
  const t = theme;
  const s = width / W;
  const svg = new Svg(width, height, {
    title: 'Chaos-to-Model: private documents in, training data you can trace out',
    desc: 'Scattered fragments of a scanned page settle into an ordered table; the cell holding 247 links back to page 14.',
    css:
      css(theme) +
      `.paper{fill:${t === THEMES.dark ? '#0b0b0b' : '#f4f1e8'}}` +
      (still ? '' :
        '.f{transform-box:fill-box;transform-origin:center;animation:settle 1.5s cubic-bezier(.2,.75,.15,1) var(--d) both}' +
        '@keyframes settle{from{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:.55}}' +
        '.n{transform-box:fill-box;transform-origin:center;opacity:0;animation:noise 1.5s ease-out var(--d) both}' +
        '@keyframes noise{0%{opacity:.85;transform:translate(var(--x),var(--y)) rotate(var(--r))}100%{opacity:0;transform:translate(var(--x2),var(--y2)) rotate(var(--r)) scale(.5)}}' +
        '.thread{stroke-dasharray:var(--len);animation:draw .8s ease-out 1.9s both}@keyframes draw{from{stroke-dashoffset:var(--len)}}' +
        '.late{animation:fade .5s ease-out 2.5s both}@keyframes fade{from{opacity:0}}' +
        '@media (prefers-reduced-motion:reduce){.f,.n,.thread,.late{animation:none}}'),
  });
  svg.defs.push(`<clipPath id="hc"><rect width="${W}" height="300" rx="20"/></clipPath>`);
  svg.add(`<g transform="scale(${s})"><g clip-path="url(#hc)">`);
  svg.add(rect(0, 0, W, 300, 'paper', 20));
  // Wordmark and lines.
  svg.text('Chaos-to-Model', 44, 128, { size: 50, weight: 'brand', tracking: -0.01 });
  svg.text('Private documents in.', 46, 176, { size: 21, weight: 500 });
  svg.text('Training data you can trace out.', 46, 204, { size: 21, weight: 500 });
  svg.text('A local data engine for Apple Silicon · Korean and English', 46, 246, { size: 13.5, cls: 'ink2' });

  // The table the fragments settle into.
  const rand = rng(7);
  const ox = 498;
  const oy = 76;
  const widths = [86, 46, 46, 46];
  const rowsN = 6;
  const cells = [];
  for (let r = 0; r < rowsN; r++) {
    let x = ox;
    widths.forEach((w, c) => {
      cells.push({ x, y: oy + r * 26, w: c === 0 ? w - rand() * 22 : w, h: 13, r, c });
      x += w + 10;
    });
  }
  const hit = cells.find((c) => c.r === 2 && c.c === 3);
  svg.add(rect(ox - 18, oy - 22, 290, 196, 'sf', 14));
  // Noise that curation removes: it never settles.
  const scraps = ['가', '¶', '7', 'ha', '§', '…', '12', '–', '□', '농', 'p.12', '|'];
  if (!still) scraps.forEach((g, i) => {
    const x = ox - 40 + rand() * 300;
    const y = oy + rand() * 160;
    const vars = `--x:${(rand() * 60 - 30).toFixed(0)}px;--y:${(rand() * 40 - 20).toFixed(0)}px;--x2:${(rand() * 80 - 40).toFixed(0)}px;--y2:${(rand() * 80 - 40).toFixed(0)}px;--r:${(rand() * 60 - 30).toFixed(0)}deg;--d:${(0.05 * i).toFixed(2)}s`;
    svg.add(`<g class="n" style="${vars}">`);
    svg.text(g, x, y, { size: 16, weight: 500, cls: 'mut' });
    svg.add('</g>');
  });
  for (const c of cells) {
    const vars = `--x:${(rand() * 260 - 200).toFixed(0)}px;--y:${(rand() * 150 - 75).toFixed(0)}px;--r:${(rand() * 80 - 40).toFixed(0)}deg;--d:${(0.15 + rand() * 0.5).toFixed(2)}s`;
    const cls = c === hit ? 'c2m' : c.r === 0 ? 'ink2' : 'soft';
    svg.add(`<g class="f" style="${vars}">${rect(c.x, c.y, c.w, c.h, cls, 4)}</g>`);
  }
  // 247 sits in its cell, the thread runs to its page.
  const hx = hit.x + hit.w / 2;
  svg.add(`<g class="late">`);
  svg.text('247', hx, hit.y + 11, { size: 11, weight: 700, cls: 'sf', anchor: 'middle' });
  svg.add('</g>');
  const px = 834;
  const py = 118;
  const sx = hit.x + hit.w;
  const sy = hit.y + hit.h / 2;
  const d = `M${sx + 4} ${sy}C${sx + 40} ${sy} ${px - 84} ${py + 6} ${px - 48} ${py + 6}`;
  svg.add(`<path class="sc2m thread" style="--len:120" d="${d}"/>`);
  svg.add(`<g class="late">`);
  svg.add(`<path class="bd" d="M${px - 40} ${py - 18}H${px + 2}L${px + 14} ${py - 6}V${py + 30}H${px - 40}Z"/>`);
  svg.add(`<path class="axis" d="M${px + 2} ${py - 18}V${py - 6}H${px + 14}"/>`);
  for (let i = 0; i < 4; i++) svg.add(rect(px - 32, py - 6 + i * 8, i === 3 ? 22 : 34, 3, 'soft', 1.5));
  svg.add(circle(px - 44, py + 6, 4, 'c2m'));
  svg.text('p.14', px - 13, py + 52, { size: 11.5, weight: 600, cls: 'ink2', anchor: 'middle' });
  svg.add('</g>');
  svg.add('</g></g>');
  return svg;
}

const FIGURES = { pipeline, timeline, story, hero, 'hero-still': (t) => hero(t, { still: true }) };
const only = process.argv.slice(2);
for (const [name, build] of Object.entries(FIGURES)) {
  if (only.length && !only.includes(name)) continue;
  const dir = path.join(ROOT, name.startsWith('hero') ? 'assets/brand' : 'assets/charts');
  fs.mkdirSync(dir, { recursive: true });
  for (const [mode, theme] of Object.entries(THEMES)) {
    const svg = build(theme).toString();
    fs.writeFileSync(path.join(dir, `${name}-${mode}.svg`), svg);
    console.log(`${name}-${mode}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
  }
}
