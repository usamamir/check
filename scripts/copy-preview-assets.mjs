import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeDist = join(root, 'wp-content/themes/jettribe/dist');
const previewAssets = join(root, 'preview/assets');
const criticalSrc = join(root, 'wp-content/themes/jettribe/src/styles/critical.css');
const criticalOut = join(themeDist, 'critical.css');

mkdirSync(previewAssets, { recursive: true });
mkdirSync(themeDist, { recursive: true });

if (existsSync(criticalSrc)) {
  // Flatten @import for inline critical use in WP + preview.
  let css = readFileSync(criticalSrc, 'utf8');
  css = css.replace(/@import\s+"\.\/tokens\.css";\s*/g, () => {
    return readFileSync(join(root, 'wp-content/themes/jettribe/src/styles/tokens.css'), 'utf8') + '\n';
  });
  writeFileSync(criticalOut, css);
  writeFileSync(join(root, 'preview/critical.css'), css);
}

cpSync(themeDist, previewAssets, { recursive: true });
cpSync(join(root, 'wp-content/themes/jettribe/assets'), join(root, 'preview/media'), { recursive: true });

const manifestPath = existsSync(join(themeDist, '.vite/manifest.json'))
  ? join(themeDist, '.vite/manifest.json')
  : join(themeDist, 'manifest.json');

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  writeFileSync(join(root, 'preview/manifest.json'), JSON.stringify(manifest, null, 2));
}

console.log('Preview assets copied.');
