import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const themeName = 'digivistaco-portfolio'
const outDir = join(root, '..', 'wordpress-theme', themeName)
const zipPath = join(root, '..', `${themeName}.zip`)
const artifactZip = '/opt/cursor/artifacts/digivistaco-wordpress-theme.zip'
const themeVersion = '1.1.0'

execSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_WP_PACK: '1' },
})

if (!existsSync(dist)) {
  throw new Error('dist/ missing after build')
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

cpSync(join(dist, 'assets'), join(outDir, 'assets'), { recursive: true })
for (const file of ['uzi-mir.jpg', 'uzi-mir-thumb.jpg']) {
  const src = join(dist, file)
  if (existsSync(src)) cpSync(src, join(outDir, file))
}

const screenshotCandidates = [
  join(root, 'public', 'screenshot.png'),
  join(root, 'screenshot.png'),
  join(root, '..', 'wordpress-theme', `${themeName}-screenshot.png`),
]
for (const src of screenshotCandidates) {
  if (existsSync(src)) {
    cpSync(src, join(outDir, 'screenshot.png'))
    break
  }
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const jsMatch = html.match(/assets\/([^"']+\.js)/)
const cssMatch = html.match(/assets\/([^"']+\.css)/)
if (!jsMatch || !cssMatch) {
  throw new Error('Could not find hashed JS/CSS in dist/index.html:\n' + html)
}
const entryJs = jsMatch[1]
const entryCss = cssMatch[1]

// Keep functions.php free of nested template quirks — build with string concat
const functionsPhp = [
  '<?php',
  '/**',
  ' * Digivistaco Portfolio theme',
  ' * Version: ' + themeVersion,
  ' */',
  '',
  "if (!defined('ABSPATH')) {",
  '  exit;',
  '}',
  '',
  "add_action('after_setup_theme', function () {",
  "  add_theme_support('title-tag');",
  '});',
  '',
  "add_action('wp_enqueue_scripts', function () {",
  '  if (!is_admin()) {',
  "    wp_dequeue_style('wp-block-library');",
  "    wp_dequeue_style('wp-block-library-theme');",
  "    wp_dequeue_style('global-styles');",
  "    wp_dequeue_style('classic-theme-styles');",
  '  }',
  '}, 100);',
  '',
  "add_action('wp_enqueue_scripts', function () {",
  '  $theme_uri = trailingslashit(get_template_directory_uri());',
  "  $assets_uri = $theme_uri . 'assets/';",
  '',
  "  $css = '" + entryCss + "';",
  "  $js  = '" + entryJs + "';",
  '',
  '  wp_enqueue_style(',
  "    'digivistaco-fonts',",
  "    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&family=Syne:wght@500;600;700;800&display=swap',",
  '    [],',
  '    null',
  '  );',
  '',
  '  // No ?ver= — query strings can break module URL resolution on some hosts',
  '  wp_enqueue_style(',
  "    'digivistaco-app',",
  '    $assets_uri . $css,',
  "    ['digivistaco-fonts'],",
  '    null',
  '  );',
  '',
  '  wp_enqueue_script(',
  "    'digivistaco-app',",
  '    $assets_uri . $js,',
  '    [],',
  '    null,',
  '    true',
  '  );',
  '',
  "  // WP 6.3+ native module support",
  "  wp_script_add_data('digivistaco-app', 'type', 'module');",
  '',
  '  // Absolute theme root for any remaining dynamic imports (must end with /)',
  '  wp_add_inline_script(',
  "    'digivistaco-app',",
  "    'window.__DIGIVISTACO_ASSETS__=' . wp_json_encode($theme_uri) . ';',",
  "    'before'",
  '  );',
  '',
  "  wp_localize_script('digivistaco-app', 'DigivistacoTheme', [",
  "    'themeUrl'   => untrailingslashit($theme_uri),",
  "    'assetsUrl'  => $assets_uri,",
  "    'photo'      => untrailingslashit($theme_uri) . '/uzi-mir.jpg',",
  "    'photoThumb' => untrailingslashit($theme_uri) . '/uzi-mir-thumb.jpg',",
  '  ]);',
  '',
  '  // Fallback for hosts that strip type from wp_script_add_data',
  "  add_filter('script_loader_tag', function ($tag, $handle, $src) {",
  "    if ($handle !== 'digivistaco-app') {",
  '      return $tag;',
  '    }',
  "    if (strpos($tag, 'type=') === false) {",
  '      $tag = str_replace(',
  "        '<script ',",
  "        '<script type=\"module\" crossorigin ',",
  '        $tag',
  '      );',
  '    }',
  '    return $tag;',
  '  }, 10, 3);',
  '}, 20);',
  '',
  "add_filter('show_admin_bar', '__return_false');",
  '',
  "add_filter('litespeed_optimize_js_excludes', function ($excludes) {",
  "  $excludes[] = 'digivistaco-app';",
  "  $excludes[] = 'index-';",
  '  return $excludes;',
  '});',
  '',
  "add_filter('litespeed_optimize_css_excludes', function ($excludes) {",
  "  $excludes[] = 'digivistaco-app';",
  "  $excludes[] = 'index-';",
  '  return $excludes;',
  '});',
  '',
].join('\n')

writeFileSync(join(outDir, 'functions.php'), functionsPhp)

writeFileSync(
  join(outDir, 'style.css'),
  `/*
Theme Name: Digivistaco Portfolio
Theme URI: https://digivistaco.com
Author: Uzi Mir
Description: SellerOS 2016 → Commerce 2026 interactive portfolio theme for Digivistaco. Full-page React experience.
Version: ${themeVersion}
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: digivistaco-portfolio
Tags: custom, portfolio, full-site-editing, one-column
*/
`,
)

writeFileSync(
  join(outDir, 'index.php'),
  `<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Uzi Mir — Amazon Master. SellerOS 2016 that updates into Commerce 2026." />
  <?php wp_head(); ?>
  <style>
    html, body { margin: 0; padding: 0; background: #000; min-height: 100%; }
    #wpadminbar { display: none !important; }
    html { margin-top: 0 !important; }
    #root { min-height: 100vh; }
  </style>
</head>
<body <?php body_class('digivistaco-portfolio'); ?>>
  <div id="root">
    <noscript>
      <div style="color:#f4efe6;font-family:system-ui,sans-serif;padding:3rem 1.5rem;max-width:40rem">
        <h1>Uzi Mir</h1>
        <p>Head of Marketing · Jettribe</p>
        <p>Enable JavaScript to load the SellerOS → Commerce 2026 portfolio.</p>
      </div>
    </noscript>
  </div>
  <?php wp_footer(); ?>
</body>
</html>
`,
)

writeFileSync(
  join(outDir, 'front-page.php'),
  `<?php
/**
 * Front page uses the same full-app shell.
 */
require get_template_directory() . '/index.php';
`,
)

writeFileSync(
  join(outDir, 'header.php'),
  `<?php
// Intentionally empty — SPA shell lives in index.php
`,
)

writeFileSync(
  join(outDir, 'footer.php'),
  `<?php
// Intentionally empty — SPA shell lives in index.php
`,
)

writeFileSync(
  join(outDir, 'README.txt'),
  `Digivistaco Portfolio — WordPress Theme v${themeVersion}
===============================================

Install / Update
----------------
1. Appearance → Themes → Add New → Upload Theme
2. Upload digivistaco-portfolio.zip
   If the theme is already installed: Delete the old Digivistaco Portfolio theme first,
   then upload this zip (or use a theme update plugin).
3. Activate "Digivistaco Portfolio"
4. Hard-refresh the site (Ctrl/Cmd+Shift+R) so cached JS is cleared

SSL / HTTPS
-----------
Enable free SSL in Hostinger for digivistaco.com and www.
Do not upload certificate files into the theme.

Notes
-----
v${themeVersion} fixes blank screen after "Update to 2026" (CSS-only transition,
single JS bundle, no WebGL hang on the critical path).
`,
)

rmSync(zipPath, { force: true })
execSync(`cd "${join(outDir, '..')}" && zip -r "${zipPath}" "${themeName}" -x "*.DS_Store"`, {
  stdio: 'inherit',
})
mkdirSync('/opt/cursor/artifacts', { recursive: true })
cpSync(zipPath, artifactZip)

// Preserve screenshot for next pack if we had one in dist sibling
console.log('Theme folder:', outDir)
console.log('Zip:', zipPath)
console.log('Artifact:', artifactZip)
console.log('Entry JS:', entryJs)
console.log('Entry CSS:', entryCss)
console.log('Version:', themeVersion)

// Sanity: single JS bundle preferred
const assetFiles = execSync(`ls "${join(outDir, 'assets')}"`, { encoding: 'utf8' })
  .trim()
  .split('\n')
const jsFiles = assetFiles.filter((f) => f.endsWith('.js'))
console.log('JS files in theme:', jsFiles.join(', '))
if (jsFiles.length > 3) {
  console.warn('Warning: expected a single (or few) JS file(s) for WP pack')
}
