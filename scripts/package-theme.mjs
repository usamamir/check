import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeSrc = join(root, 'wp-content/themes/jettribe');
const staging = join(root, '.theme-pack/jettribe');
const outDir = join(root, 'preview/downloads');
const artifacts = '/opt/cursor/artifacts';

rmSync(join(root, '.theme-pack'), { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(artifacts, { recursive: true });

cpSync(themeSrc, staging, {
  recursive: true,
  filter: (src) => !src.includes(`${themeSrc}/src`) && !src.endsWith('.map'),
});

// Keep a README inside the theme zip for installers.
writeFileSync(
  join(staging, 'INSTALL.txt'),
  `Jettribe WordPress Theme
========================

1. Upload this zip via Appearance → Themes → Add New → Upload Theme
   (or unzip into wp-content/themes/jettribe).
2. Install and activate WooCommerce.
3. Activate the Jettribe theme.
4. Settings → Permalinks → Save (Pretty permalinks).
5. Optional: visit wp-admin/?jt_seed_placeholders=1 as an admin to seed PLACEHOLDER products.
6. Replace placeholders with your real catalog CSV via scripts/import-products when available.

Built assets are in dist/. Rebuild with npm run build if you change src/.
`,
);

const zipPath = join(outDir, 'jettribe-theme.zip');
rmSync(zipPath, { force: true });
execSync(`cd "${join(root, '.theme-pack')}" && zip -r "${zipPath}" jettribe -x "*.map" -x "*/src/*"`, {
  stdio: 'inherit',
});
cpSync(zipPath, join(artifacts, 'jettribe-theme.zip'));
console.log(`Theme packaged: ${zipPath}`);
console.log(`Artifact copy: ${join(artifacts, 'jettribe-theme.zip')}`);
