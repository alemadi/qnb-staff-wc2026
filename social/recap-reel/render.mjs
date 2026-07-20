#!/usr/bin/env node
/* Staff Challenge 26 — recap reel renderer.
 *
 *   node render.mjs                → full 1080×1920@30fps MP4 next to this file
 *   node render.mjs --stills 1,5,9 → JPEG stills at those timestamps (design pass)
 *
 * Env: OUT_DIR (frame/still scratch, default ./frames), FPS (default 30),
 *      FFMPEG (path to an H.264-capable ffmpeg), AUDIO (optional soundtrack to mux).
 * Uses the same global Playwright install as tests/share-cards/run.mjs.
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FPS = +(process.env.FPS || 30);
const OUT_DIR = process.env.OUT_DIR || path.join(HERE, 'frames');
const FFMPEG = process.env.FFMPEG ||
  '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const stillsArg = process.argv.indexOf('--stills');
const STILLS = stillsArg > -1 ? process.argv[stillsArg + 1].split(',').map(Number) : null;

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(HERE, 'reel.html') + '#render' + (process.env.HASH || ''));
await page.evaluate(() => window.__ready);
await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
const DUR = await page.evaluate(() => window.__dur);

if (STILLS) {
  for (const t of STILLS) {
    await page.evaluate(t => window.__seek(t), t);
    const f = path.join(OUT_DIR, `still-${String(t).replace('.', '_')}s.jpg`);
    await page.screenshot({ path: f, type: 'jpeg', quality: 92 });
    console.log('still', t + 's →', f);
  }
  await browser.close();
  process.exit(0);
}

const N = Math.round(DUR * FPS);
console.log(`rendering ${N} frames @ ${FPS}fps (${DUR}s)…`);
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  await page.evaluate(t => window.__seek(t), i / FPS);
  await page.screenshot({ path: path.join(OUT_DIR, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  if (i % 150 === 0) console.log(`  frame ${i}/${N} (${((Date.now() - t0) / 1000) | 0}s elapsed)`);
}
await browser.close();
console.log(`frames done in ${((Date.now() - t0) / 1000) | 0}s — encoding…`);

const out = path.join(HERE, 'recap-reel.mp4');
const args = ['-y', '-framerate', String(FPS), '-i', path.join(OUT_DIR, 'f%05d.jpg')];
if (process.env.AUDIO) args.push('-i', process.env.AUDIO);
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
if (process.env.AUDIO) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push(out);
const r = spawnSync(FFMPEG, args, { stdio: ['ignore', 'inherit', 'inherit'] });
if (r.status !== 0) { console.error('ffmpeg failed'); process.exit(1); }
console.log('wrote', out);
