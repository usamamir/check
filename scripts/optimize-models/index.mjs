#!/usr/bin/env node
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = join(root, 'assets-source/models');
const out = join(root, 'wp-content/themes/jettribe/assets/models');
mkdirSync(out, { recursive: true });

if (!existsSync(src) || !readdirSync(src).some((f) => f.endsWith('.glb'))) {
  console.log('No GLB models in assets-source/models/. Skipping optimize.');
  process.exit(0);
}

console.log('Install @gltf-transform/cli to compress models when GLBs are present.');
console.log('Budgets: 1.5MB / 100k tris / 2048px hero textures.');
process.exit(0);
