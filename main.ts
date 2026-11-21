// Lantern Thief — the program that hands the game in (Node 22, standard
// library only). It copies the playable game and its screenshots from
// this repository into the output directory and writes dossier.json,
// the summary the judge reads, using buildDossier from the kit's
// vendored library (vendor/makefun-game.ts, unchanged).
//
// The grader runs this file twice and expects identical bytes both
// times, so it does no clock or random work: it copies files and writes
// the dossier the library computes from them. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += 1;
    if (statSync(path).isDirectory()) total += countEntries(path);
  }
  return total;
}

function handIn() {
  const gameSource = join(repoRoot, 'game');
  const indexHtml = join(gameSource, 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error(`game/index.html is missing at ${indexHtml} — nothing to hand in`);
  }
  mkdirSync(outDir, { recursive: true });

  const gameTarget = join(outDir, 'game');
  copyTree(gameSource, gameTarget);

  const shotsSource = join(repoRoot, 'screenshots');
  const shotsTarget = join(outDir, 'screenshots');
  if (existsSync(shotsSource)) copyTree(shotsSource, shotsTarget);
  else mkdirSync(shotsTarget, { recursive: true });

  // The dossier is the library's own write from the copied files: the
  // scorer rebuilds it with the same library and compares byte for byte,
  // so nothing here may add, drop or reorder a file after this call.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  return {
    gameFiles: countEntries(gameTarget),
    screenshots: readdirSync(shotsTarget).filter((n) => !n.startsWith('.')),
    dossierBytes: Buffer.byteLength(dossier, 'utf8'),
  };
}

const summary = handIn();
console.log(
  `Lantern Thief handed in: ${summary.gameFiles} game entries, ` +
    `${summary.screenshots.length} screenshots (${summary.screenshots.join(', ')}), ` +
    `dossier ${summary.dossierBytes} bytes -> ${outDir}`,
);
