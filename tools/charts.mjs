// Renders every benchmark figure in assets/charts/ from data/benchmarks/, once per theme.
//   cd tools && npm install && npm run charts
import fs from 'node:fs';
import path from 'node:path';
import { Svg, measure, hbar, rect, line, circle, fmt } from './lib/svg.mjs';
import { THEMES, css, SERIES } from './lib/theme.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const data = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/benchmarks', name), 'utf8'));
const OUT = path.join(ROOT, 'assets/charts');
const W = 880;
const PAD = 32;

const parsing = data('parsing.json');
const datasets = data('datasets.json');
const folds = data('proxy-folds.json');

// ---------- shared pieces ----------

function header(svg, { title, sub = [], legend = true }) {
  svg.text(title, PAD, 52, { size: 21, weight: 600 });
  let y = 78;
  for (const s of sub) {
    svg.text(s, PAD, y, { size: 14, cls: 'ink2' });
    y += 21;
  }
  if (legend) {
    y += 8;
    let x = PAD;
    for (const s of SERIES) {
      svg.add(rect(x, y - 10, 10, 10, s.cls, 3));
      x += 16 + svg.text(s.long, x + 16, y, { size: 13, weight: 500, cls: 'ink2' }) + 22;
    }
    y += 10;
  }
  return y;
}

function footer(svg, lines) {
  let y = svg.height - 22 - (lines.length - 1) * 18;
  for (const l of lines) {
    svg.text(l, PAD, y, { size: 12, cls: 'mut' });
    y += 18;
  }
}

// A titled group of horizontal bars, one per pipeline. Rows may carry `text` (no bar) and `note`.
function barPanel(svg, { x, y, w, title, hint, rows, max, unit = '', digits = 0, labelW = 104 }) {
  svg.text(title, x, y, { size: 15, weight: 600 });
  if (hint) svg.text(hint, x + w, y, { size: 12, cls: 'mut', anchor: 'end' });
  const top = y + 18;
  const pitch = 32;
  const room = Math.max(...rows.map((r) => (r.v == null ? 0 : measure(fmt(r.v, digits) + unit, 13, 500)))) + 10;
  const barMax = w - labelW - room;
  rows.forEach((row, i) => {
    const by = top + i * pitch;
    svg.text(row.label, x, by + 13, { size: 13, weight: 500, cls: 'ink2' });
    const bx = x + labelW;
    if (row.v == null) {
      svg.text(row.text, bx + 2, by + 13, { size: 13, cls: 'mut' });
      return;
    }
    const bw = row.v === 0 ? 0 : Math.max(2, (row.v / max) * barMax);
    svg.add(hbar(bx, by + 1, bw, 16, row.cls));
    const vx = bx + bw + 8;
    const vw = svg.text(fmt(row.v, digits) + unit, vx, by + 14, { size: 13, weight: 500 });
    if (row.note) svg.text(row.note, vx + vw + 8, by + 14, { size: 12, cls: 'mut' });
  });
  svg.add(line(x + labelW, top - 4, x + labelW, top + rows.length * pitch - 10, 'axis'));
  return top + rows.length * pitch;
}

function rowsFor(values, extra = {}) {
  return SERIES.map((s) => ({ label: s.label, cls: s.cls, v: values[s.key], ...(extra[s.key] || {}) }));
}

// ---------- figures ----------

function kpis(theme) {
  const H = 248;
  const svg = new Svg(W, H, {
    title: 'Chaos-to-Model at a glance',
    desc:
      'Four measurements on the same 12 files. A scanned 310-page Korean guide: c2m extracted 203,577 characters, Unsloth refused the upload, NeMo Curator extracted 309. ' +
      'Hangul characters on 28 scanned pages: c2m 4,337, Unsloth 162, NeMo Curator 162. Table rows kept in 8 Korean PDFs: c2m 6,727, Unsloth 4,622, NeMo Curator 0. ' +
      "Generated questions in the passage's own language: c2m 100%, Unsloth 92.6%, NeMo Curator 29.7%.",
    css: css(theme),
  });
  const q = datasets.qa;
  const ocr = parsing.ocr_diagnostic_pages;
  const rose = parsing.scanned_rose_guide;
  const tables = parsing.korean_pdf_totals;
  const tiles = [
    { label: 'A scanned 310-page guide', sub: 'characters extracted', value: fmt(rose.c2m.chars),
      rows: [rose.c2m.chars, null, rose.curator.chars], text: [null, 'refused', null] },
    { label: '28 scanned pages', sub: 'Korean characters read', value: fmt(ocr.c2m_hangul),
      rows: [ocr.c2m_hangul, ocr.unsloth_hangul, ocr.curator_hangul] },
    { label: 'Tables in 8 Korean PDFs', sub: 'table rows kept', value: fmt(tables.c2m.table_rows),
      rows: [tables.c2m.table_rows, tables.unsloth.table_rows, tables.curator.table_rows] },
    { label: 'Generated questions', sub: "in the passage's language", value: '100%',
      rows: [q.c2m.question_in_passage_language * 100, q.unsloth.question_in_passage_language * 100, q.curator.question_in_passage_language * 100],
      unit: '%', digits: 1 },
  ];
  const gap = 16;
  const tw = (W - gap * 3) / 4;
  tiles.forEach((t, i) => {
    const x = i * (tw + gap);
    svg.add(rect(x + 0.5, 0.5, tw - 1, H - 1, 'bd', 14));
    const cx = x + 20;
    const cw = tw - 40;
    svg.text(t.label, cx, 34, { size: 13.5, weight: 600 });
    svg.text(t.sub, cx, 53, { size: 13, cls: 'ink2' });
    svg.text(t.value, cx, 104, { size: 38, weight: 600, tracking: -0.02 });
    const max = Math.max(...t.rows.filter((v) => v != null));
    t.rows.forEach((v, j) => {
      const y = 140 + j * 34;
      const s = SERIES[j];
      svg.text(s.label, cx, y, { size: 12, weight: 500, cls: 'ink2' });
      const label = v == null ? t.text[j] : t.unit ? fmt(v, v === 100 ? 0 : t.digits) + t.unit : fmt(v);
      svg.text(label, cx + cw, y, { size: 12, weight: 500, cls: v == null ? 'mut' : 'ink', anchor: 'end' });
      svg.add(rect(cx, y + 7, cw, 6, 'trk', 3));
      if (v) svg.add(hbar(cx, y + 7, Math.max(3, (v / max) * cw), 6, s.cls, 3));
    });
  });
  return svg;
}

function scans(theme) {
  const H = 340;
  const rose = parsing.scanned_rose_guide;
  const ocr = parsing.ocr_diagnostic_pages;
  const svg = new Svg(W, H, {
    title: 'Reading scanned pages',
    desc:
      `Scanned 310-page rose guide, characters extracted: c2m ${fmt(rose.c2m.chars)}; Unsloth refused the upload because 37 pages needed OCR and its limit is 20; NeMo Curator ${fmt(rose.curator.chars)} through its CPU text-layer path. ` +
      `Hangul characters on the 28 pages Unsloth sends to OCR: c2m ${fmt(ocr.c2m_hangul)}, Unsloth ${fmt(ocr.unsloth_hangul)} plus ${fmt(ocr.unsloth_latin)} Latin letters from English OCR, NeMo Curator ${fmt(ocr.curator_hangul)}.`,
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  let y = header(svg, {
    title: 'Reading what is actually on the page',
    sub: ['Korean agricultural guides with image-only pages. Same files, matched by SHA-256.'],
  });
  const pw = (W - PAD * 2 - 40) / 2;
  y += 40;
  barPanel(svg, {
    x: PAD, y, w: pw, title: 'A scanned 310-page guide', hint: 'characters extracted', max: rose.c2m.chars,
    rows: rowsFor({ c2m: rose.c2m.chars, unsloth: null, curator: rose.curator.chars }, {
      unsloth: { text: 'Upload refused: 37 pages need OCR, limit 20' },
      curator: { note: 'CPU text-layer path' },
    }),
  });
  barPanel(svg, {
    x: PAD + pw + 40, y, w: pw, title: '28 scanned pages', hint: 'Hangul characters', max: ocr.c2m_hangul,
    rows: rowsFor({ c2m: ocr.c2m_hangul, unsloth: ocr.unsloth_hangul, curator: ocr.curator_hangul }, {
      unsloth: { note: `+ ${fmt(ocr.unsloth_latin)} Latin letters (English OCR)` },
    }),
  });
  footer(svg, [
    "Counts of extracted output, not OCR accuracy. NeMo Curator's GPU PDF parser was not part of this configuration.",
    `Data: data/benchmarks/parsing.json`,
  ]);
  return svg;
}

function structure(theme) {
  const H = 512;
  const t = parsing.korean_pdf_totals;
  const svg = new Svg(W, H, {
    title: 'Keeping the structure of Korean PDFs',
    desc:
      `Totals over eight Korean agricultural PDFs. Table rows kept: c2m ${fmt(t.c2m.table_rows)}, Unsloth ${fmt(t.unsloth.table_rows)}, NeMo Curator ${t.curator.table_rows}. ` +
      `Page-number lines left in the text: c2m ${t.c2m.page_number_lines}, Unsloth ${fmt(t.unsloth.page_number_lines)}, NeMo Curator ${fmt(t.curator.page_number_lines)}. ` +
      `Words split by a line break per 1,000 Hangul: c2m ${t.c2m.broken_words_per_1k_hangul}, Unsloth ${t.unsloth.broken_words_per_1k_hangul}, NeMo Curator ${t.curator.broken_words_per_1k_hangul}. ` +
      `Unicode replacement characters: c2m ${t.c2m.replacement_chars}, Unsloth ${t.unsloth.replacement_chars}, NeMo Curator ${t.curator.replacement_chars}.`,
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  let y = header(svg, {
    title: 'Keeping the structure of Korean PDFs',
    sub: ['Totals over eight Korean agricultural guides. A table that becomes loose numbers, a page number', 'inside a sentence, or a word cut in two all change what a model learns.'],
  });
  const pw = (W - PAD * 2 - 40) / 2;
  const pick = (k) => ({ c2m: t.c2m[k], unsloth: t.unsloth[k], curator: t.curator[k] });
  y += 40;
  const panels = [
    { title: 'Table rows kept', hint: 'higher is better', k: 'table_rows' },
    { title: 'Page-number lines left in the text', hint: 'lower is better', k: 'page_number_lines' },
    { title: 'Words split by a line break', hint: 'per 1,000 Hangul · lower is better', k: 'broken_words_per_1k_hangul', digits: 1 },
    { title: 'Replacement characters (U+FFFD)', hint: 'lower is better', k: 'replacement_chars' },
  ];
  panels.forEach((p, i) => {
    const v = pick(p.k);
    barPanel(svg, {
      x: PAD + (i % 2) * (pw + 40), y: y + Math.floor(i / 2) * 150, w: pw, title: p.title, hint: p.hint,
      rows: rowsFor(v), max: Math.max(...Object.values(v)), digits: p.digits || 0,
    });
  });
  footer(svg, [
    "Unsloth refused one guide and NeMo Curator's text-layer path found no text in it, so each reports 7 of the 8 PDFs.",
    'Data: data/benchmarks/parsing.json',
  ]);
  return svg;
}

function datasetFigure(theme) {
  const H = 512;
  const q = datasets.qa;
  const rp = datasets.rephrase;
  const svg = new Svg(W, H, {
    title: 'What each pipeline wrote',
    desc:
      `Questions in the passage's language: c2m 100%, Unsloth ${(q.unsloth.question_in_passage_language * 100).toFixed(1)}%, NeMo Curator ${(q.curator.question_in_passage_language * 100).toFixed(1)}%. ` +
      `Rephrases kept in the source language: c2m 100%, NeMo Curator ${(rp.curator.output_in_source_language * 100).toFixed(1)}%; the Unsloth recipe has no rephrase step. ` +
      `Numbers kept when rephrasing: c2m ${(rp.c2m.numbers_kept * 100).toFixed(0)}%, NeMo Curator ${(rp.curator.numbers_kept * 100).toFixed(1)}%. ` +
      `Abstention examples: c2m ${q.c2m.abstain_rows}, Unsloth 0, NeMo Curator 0.`,
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  let y = header(svg, {
    title: 'What each pipeline wrote',
    sub: ['Training sets generated from the same 12 files by the same local teacher model.', 'Most of the source text is Korean, so language is the first thing to keep.'],
  });
  const pw = (W - PAD * 2 - 40) / 2;
  y += 40;
  const pct = (v) => (v == null ? null : v * 100);
  barPanel(svg, {
    x: PAD, y, w: pw, title: "Questions in the passage's language", hint: 'higher is better', max: 100, unit: '%', digits: 1,
    rows: rowsFor({ c2m: pct(q.c2m.question_in_passage_language), unsloth: pct(q.unsloth.question_in_passage_language), curator: pct(q.curator.question_in_passage_language) }),
  });
  barPanel(svg, {
    x: PAD + pw + 40, y, w: pw, title: 'Rephrases in the source language', hint: 'higher is better', max: 100, unit: '%', digits: 1,
    rows: rowsFor({ c2m: pct(rp.c2m.output_in_source_language), unsloth: null, curator: pct(rp.curator.output_in_source_language) }, {
      unsloth: { text: 'no rephrase step in this recipe' },
    }),
  });
  barPanel(svg, {
    x: PAD, y: y + 150, w: pw, title: 'Numbers kept when rephrasing', hint: 'higher is better', max: 100, unit: '%', digits: 1,
    rows: rowsFor({ c2m: pct(rp.c2m.numbers_kept), unsloth: null, curator: pct(rp.curator.numbers_kept) }, {
      unsloth: { text: 'no rephrase step in this recipe' },
    }),
  });
  barPanel(svg, {
    x: PAD + pw + 40, y: y + 150, w: pw, title: 'Examples that teach "not in the passage"', hint: 'count', max: q.c2m.abstain_rows,
    rows: rowsFor({ c2m: q.c2m.abstain_rows, unsloth: q.unsloth.abstain_rows, curator: q.curator.abstain_rows }),
  });
  footer(svg, [
    `Rows: c2m ${q.c2m.rows} SFT rows, Unsloth ${q.unsloth.rows}, NeMo Curator ${fmt(q.curator.rows)}. Teacher: ${datasets.teacher}.`,
    'Data: data/benchmarks/datasets.json',
  ]);
  return svg;
}

// Signed values with a true minus sign; a difference that rounds to zero carries no sign.
const signed = (k, d) => (v) => {
  const t = Math.abs(v * k).toFixed(d);
  return Number(t) === 0 ? t : `${v > 0 ? '+' : '−'}${t}`;
};

// Dot-and-interval panels share one row layout.
const PROXY_ROWS = [
  { key: 'c2m', cls: 'c2m', s: 'sc2m', label: 'c2m' },
  { key: 'unsloth', cls: 'uns', s: 'suns', label: 'Unsloth' },
  { key: 'curator', cls: 'cur', s: 'scur', label: 'NeMo Curator' },
  { key: 'base', cls: 'base', s: 'sbase', label: 'Untuned student' },
];

function intervalLabel(svg, text, xs, { left, right, y }) {
  const w = measure(text, 12, 500);
  if (xs.high + 8 + w <= right) svg.text(text, xs.high + 8, y, { size: 12, weight: 500 });
  else if (xs.low - 8 - w >= left) svg.text(text, xs.low - 8, y, { size: 12, weight: 500, anchor: 'end' });
  else svg.text(text, xs.mean, y - 12, { size: 12, weight: 500, anchor: 'middle' });
}

function proxyScores(theme) {
  const H = 452;
  const P = folds.pipelines;
  const rows = folds.run.train_rows;
  const svg = new Svg(W, H, {
    title: 'What a small model learns from each set',
    desc:
      'Mean score with 95% interval, clustered by work, over 167 held-out questions. ' +
      PROXY_ROWS.map((r) => `${r.label}: contains ${(P[r.key].contains.mean * 100).toFixed(1)}%, exact ${(P[r.key].exact.mean * 100).toFixed(1)}%, log-likelihood ${P[r.key].loglik.mean.toFixed(2)} nats per character`).join('; ') +
      '. Contains is the pre-registered primary score.',
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  let y = header(svg, {
    title: 'What a small model learns from each set',
    sub: [
      'A Gemma 4 E2B student is LoRA-tuned on each set for the same 300 steps, then answers questions about',
      'works it never saw: 167 questions over 10 held-out works. Dots are means; lines are 95% intervals.',
    ],
    legend: false,
  });
  const labelW = 168;
  const gap = 28;
  const x0 = PAD + labelW;
  const pw = (W - PAD - x0 - gap * 2) / 3;
  const panels = [
    { m: 'contains', title: 'Reply contains the answer', unit: 'share of questions', domain: [0.5, 0.85], ticks: [0.5, 0.6, 0.7, 0.8], f: (v) => `${(v * 100).toFixed(1)}%`, tf: (v) => `${v * 100}%`, primary: true },
    { m: 'exact', title: 'Reply matches exactly', unit: 'share of questions', domain: [0.2, 0.55], ticks: [0.2, 0.3, 0.4, 0.5], f: (v) => `${(v * 100).toFixed(1)}%`, tf: (v) => `${Math.round(v * 100)}%` },
    { m: 'loglik', title: 'Likelihood of the answer', unit: 'nats per character', domain: [-1.4, 0], ticks: [-1.2, -0.8, -0.4, 0], f: (v) => v.toFixed(2).replace('-', '−'), tf: (v) => (v === 0 ? '0' : v.toFixed(1).replace('-', '−')) },
  ];
  const top = y + 88;
  const pitch = 44;
  PROXY_ROWS.forEach((r, i) => {
    const ry = top + i * pitch;
    svg.add(circle(PAD + 5, ry - 4, 5, r.cls));
    svg.text(r.label, PAD + 18, ry, { size: 13.5, weight: 600, cls: 'ink' });
    svg.text(r.key === 'base' ? 'no training, the floor' : `${fmt(rows[r.key])} training rows`, PAD + 18, ry + 17, { size: 12, cls: 'mut' });
  });
  const bottom = top + (PROXY_ROWS.length - 1) * pitch + 22;
  panels.forEach((p, i) => {
    const left = x0 + i * (pw + gap);
    const right = left + pw;
    const X = (v) => left + ((v - p.domain[0]) / (p.domain[1] - p.domain[0])) * pw;
    let tx = left;
    if (p.primary) {
      const tw = measure('PRIMARY', 10, 700, 0.06) + 14;
      svg.add(rect(left, y + 2, tw, 18, 'pill', 9));
      svg.text('PRIMARY', left + 7, y + 15, { size: 10, weight: 700, cls: 'pillInk', tracking: 0.06 });
    }
    svg.text(p.title, tx, y + 40, { size: 14, weight: 600 });
    svg.text(p.unit, tx, y + 57 - 0, { size: 12, cls: 'mut' });
    for (const t of p.ticks) {
      svg.add(line(X(t), top - 20, X(t), bottom, 'grid'));
      svg.text(p.tf(t), X(t), bottom + 18, { size: 11.5, cls: 'mut', anchor: 'middle' });
    }
    svg.add(line(left, bottom, right, bottom, 'axis'));
    PROXY_ROWS.forEach((r, j) => {
      const s = P[r.key][p.m];
      const ry = top + j * pitch - 4;
      const xs = { low: X(s.low), high: X(s.high), mean: X(s.mean) };
      svg.add(line(xs.low, ry, xs.high, ry, r.s));
      svg.add(line(xs.low, ry - 4, xs.low, ry + 4, r.s), line(xs.high, ry - 4, xs.high, ry + 4, r.s));
      svg.add(`<circle class="${r.cls} ring" cx="${xs.mean}" cy="${ry}" r="5.5"/>`);
      intervalLabel(svg, p.f(s.mean), xs, { left, right, y: ry + 4.5 });
    });
  });
  footer(svg, [
    'The untuned student answers at length (median 39 characters against 19 for c2m), so "contains" favours it; tuning teaches',
    'the short exact reply. Seed 0, folds 1-5 of 6. Protocol c2m.folds/1, committed before the runs. Data: data/benchmarks/proxy-folds.json',
  ]);
  return svg;
}

function proxyDiffs(theme) {
  const H = 552;
  const D = folds.c2m_minus_other;
  const svg = new Svg(W, H, {
    title: 'Paired differences, c2m minus each baseline',
    desc:
      'Differences on the same questions with 95% intervals clustered by work; positive favours c2m. ' +
      ['unsloth', 'curator'].map((o) => ['all', 'c2m', 'unsloth'].map((src) => ['contains', 'exact', 'loglik'].map((m) => {
        const d = D[o][src][m].c2m_minus_other;
        return `vs ${o}, ${src} questions, ${m}: ${d.mean.toFixed(3)} [${d.low.toFixed(3)}, ${d.high.toFixed(3)}]`;
      }).join('; ')).join('; ')).join('; '),
    css: css(theme),
  });
  svg.add(rect(0.5, 0.5, W - 1, H - 1, 'bd', 16));
  let y = header(svg, {
    title: 'Paired differences: c2m minus each baseline',
    sub: [
      'Same questions, same student, same steps. Right of zero favours c2m. A difference counts only',
      'when its 95% interval excludes zero (filled dot). Hollow dots are ties within the noise.',
    ],
    legend: false,
  });
  const labelW = 214;
  const gap = 24;
  const x0 = PAD + labelW;
  const pw = (W - PAD - x0 - gap * 2) / 3;
  const panels = [
    { m: 'contains', title: 'Contains the answer', unit: 'percentage points', domain: [-0.22, 0.22], ticks: [-0.2, -0.1, 0, 0.1, 0.2], f: signed(100, 1), tf: (v) => (v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v * 100)}`), primary: true },
    { m: 'exact', title: 'Exact match', unit: 'percentage points', domain: [-0.22, 0.22], ticks: [-0.2, -0.1, 0, 0.1, 0.2], f: signed(100, 1), tf: (v) => (v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v * 100)}`) },
    { m: 'loglik', title: 'Answer likelihood', unit: 'nats per character', domain: [-0.65, 0.45], ticks: [-0.6, -0.3, 0, 0.3], f: signed(1, 2), tf: (v) => (v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`) },
  ];
  const groups = [
    { o: 'unsloth', label: 'vs Unsloth Data Recipes', cls: 'uns' },
    { o: 'curator', label: 'vs NeMo Curator', cls: 'cur' },
  ];
  const sources = [
    { src: 'all', label: 'All questions' },
    { src: 'c2m', label: 'Written by c2m' },
    { src: 'unsloth', label: 'Written by Unsloth' },
  ];
  const top = y + 94;
  const rowsY = [];
  let ry = top;
  groups.forEach((g, gi) => {
    svg.add(rect(PAD, ry - 10, 10, 10, g.cls, 3));
    svg.text(g.label, PAD + 16, ry, { size: 13.5, weight: 600 });
    ry += 30;
    for (const s of sources) {
      const n = D[g.o][s.src].contains.paired;
      svg.text(s.label, PAD + 16, ry, { size: 13, cls: 'ink2' });
      svg.text(String(n), PAD + labelW - 16, ry, { size: 12, cls: 'mut', anchor: 'end' });
      rowsY.push({ y: ry - 4, o: g.o, src: s.src });
      ry += 28;
    }
    ry += gi === 0 ? 14 : 0;
  });
  const bottom = ry - 12;
  svg.text('questions', PAD + labelW - 16, top - 30, { size: 12, cls: 'mut', anchor: 'end' });
  panels.forEach((p, i) => {
    const left = x0 + i * (pw + gap);
    const right = left + pw;
    const X = (v) => left + ((v - p.domain[0]) / (p.domain[1] - p.domain[0])) * pw;
    if (p.primary) {
      const tw = measure('PRIMARY', 10, 700, 0.06) + 14;
      svg.add(rect(left, y + 2, tw, 18, 'pill', 9));
      svg.text('PRIMARY', left + 7, y + 15, { size: 10, weight: 700, cls: 'pillInk', tracking: 0.06 });
    }
    svg.text(p.title, left, y + 40, { size: 14, weight: 600 });
    svg.text(p.unit, left, y + 57, { size: 12, cls: 'mut' });
    for (const t of p.ticks) {
      svg.add(line(X(t), top - 22, X(t), bottom, t === 0 ? 'axis' : 'grid'));
      svg.text(p.tf(t), X(t), bottom + 18, { size: 11.5, cls: 'mut', anchor: 'middle' });
    }
    svg.text('baseline better', left, bottom + 38, { size: 11.5, cls: 'mut' });
    svg.text('c2m better', right, bottom + 38, { size: 11.5, cls: 'mut', anchor: 'end' });
    for (const row of rowsY) {
      const d = D[row.o][row.src][p.m].c2m_minus_other;
      const sig = d.low > 0 || d.high < 0;
      const xs = { low: X(d.low), high: X(d.high), mean: X(d.mean) };
      svg.add(line(xs.low, row.y, xs.high, row.y, sig ? 'sc2m' : 'smut'));
      svg.add(sig ? `<circle class="c2m ring" cx="${xs.mean}" cy="${row.y}" r="5.5"/>` : `<circle class="hollow sc2m" cx="${xs.mean}" cy="${row.y}" r="4.5"/>`);
      intervalLabel(svg, p.f(d.mean), xs, { left, right, y: row.y + 4.5 });
    }
  });
  footer(svg, [
    'Intervals are clustered by work (10 works). Seed 0, folds 1-5 of 6; folds and seeds still to run are reported when they finish.',
    'Data: data/benchmarks/proxy-folds.json · Protocol: docs/protocol/c2m.folds-1.md',
  ]);
  return svg;
}

const FIGURES = { kpis, scans, structure, datasets: datasetFigure, 'proxy-scores': proxyScores, 'proxy-diffs': proxyDiffs };

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [name, build] of Object.entries(FIGURES)) {
  if (only.length && !only.includes(name)) continue;
  for (const [mode, theme] of Object.entries(THEMES)) {
    const svg = build(theme).toString();
    fs.writeFileSync(path.join(OUT, `${name}-${mode}.svg`), svg);
    console.log(`${name}-${mode}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
  }
}
