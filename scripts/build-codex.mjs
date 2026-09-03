/**
 * Bundles `scripts/codex.ts` with esbuild and writes the generated codex.
 * Going through esbuild lets the generator import the game's real TypeScript
 * data tables, which is the whole point: the document cannot go stale.
 *
 *   npm run codex            # Korean, to docs/CODEX.md
 *   npm run codex -- en      # English, to docs/CODEX.en.md
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const locale = process.argv[2] ?? 'ko';
const outFile = locale === 'ko' ? 'docs/CODEX.md' : `docs/CODEX.${locale}.md`;

const bundlePath = join(tmpdir(), `odyssey-codex-${process.pid}.mjs`);
await build({
  entryPoints: ['scripts/codex.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundlePath,
  logLevel: 'error',
});

const { buildCodex } = await import(pathToFileURL(bundlePath).href);
mkdirSync('docs', { recursive: true });
writeFileSync(outFile, buildCodex(locale), 'utf8');
console.log(`wrote ${outFile}`);
