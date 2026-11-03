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

execSync('npm run build', { cwd: root, stdio: 'inherit' })

if (!existsSync(dist)) {
  throw new Error('dist/ missing after build')
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

// Copy built assets + photos
cpSync(join(dist, 'assets'), join(outDir, 'assets'), { recursive: true })
for (const file of ['uzi-mir.jpg', 'uzi-mir-thumb.jpg']) {
  const src = join(dist, file)
  if (existsSync(src)) cpSync(src, join(outDir, file))
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const jsMatch = html.match(/assets\/(index-[^"']+\.js)/)
const cssMatch = html.match(/assets\/(index-[^"']+\.css)/)
if (!jsMatch || !cssMatch) {
  throw new Error('Could not find hashed JS/CSS in dist/index.html')
}
const entryJs = jsMatch[1]
const entryCss = cssMatch[1]

writeFileSync(
  join(outDir, 'style.css'),
  `/*
Theme Name: Digivistaco Portfolio
Theme URI: https://digivistaco.com
Author: Uzi Mir
Description: SellerOS 2016 → Commerce 2026 interactive portfolio theme for Digivistaco. Full-page React experience.
Version: 1.0.0
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
  join(outDir, 'functions.php'),
  `<?php
/**
 * Digivistaco Portfolio theme
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
});

/**
 * Remove default WP frontend chrome — this theme is a full-page app.
 */
add_action('wp_enqueue_scripts', function () {
  // Keep jQuery out of the way for the SPA front page
  if (!is_admin()) {
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    wp_dequeue_style('global-styles');
    wp_dequeue_style('classic-theme-styles');
  }
}, 100);

add_action('wp_enqueue_scripts', function () {
  $theme_uri = trailingslashit(get_template_directory_uri());
  $assets_uri = $theme_uri . 'assets/';

  $css = '${entryCss}';
  $js  = '${entryJs}';

  wp_enqueue_style(
    'digivistaco-fonts',
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&family=Syne:wght@500;600;700;800&display=swap',
    [],
    null
  );

  // No ?ver= on CSS/JS — version query strings can break Vite relative chunk imports
  wp_enqueue_style(
    'digivistaco-app',
    $assets_uri . $css,
    ['digivistaco-fonts'],
    null
  );

  wp_enqueue_script(
    'digivistaco-app',
    $assets_uri . $js,
    [],
    null,
    true
  );

  // Theme root URL for Vite dynamic chunks (must end with /)
  wp_add_inline_script(
    'digivistaco-app',
    'window.__DIGIVISTACO_ASSETS__=' . wp_json_encode($theme_uri) . ';',
    'before'
  );

  wp_localize_script('digivistaco-app', 'DigivistacoTheme', [
    'themeUrl'   => untrailingslashit($theme_uri),
    'assetsUrl'  => $assets_uri,
    'photo'      => untrailingslashit($theme_uri) . '/uzi-mir.jpg',
    'photoThumb' => untrailingslashit($theme_uri) . '/uzi-mir-thumb.jpg',
  ]);

  // Vite module scripts need type="module"
  add_filter('script_loader_tag', function ($tag, $handle, $src) {
    if ($handle === 'digivistaco-app') {
      return '<script type="module" crossorigin src="' . esc_url($src) . '" id="digivistaco-app-js"></script>' . "\n";
    }
    return $tag;
  }, 10, 3);
}, 20);

// Hide WP admin bar on front for clean portfolio presentation
add_filter('show_admin_bar', '__return_false');

// Help Hostinger / LiteSpeed: do not combine or defer this module bundle
add_filter('litespeed_optimize_js_excludes', function ($excludes) {
  $excludes[] = 'digivistaco-app';
  $excludes[] = 'index-';
  return $excludes;
});
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
  </style>
</head>
<body <?php body_class('digivistaco-portfolio'); ?>>
  <div id="root"></div>
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
  `Digivistaco Portfolio — WordPress Theme
=====================================

Install
-------
1. WordPress Admin → Appearance → Themes → Add New → Upload Theme
2. Upload digivistaco-portfolio.zip
3. Activate "Digivistaco Portfolio"
4. Settings → Reading → "Your homepage displays" → A static page
   (or keep latest posts — front-page.php / index.php still loads the app)

SSL / HTTPS
-----------
Enable free SSL in Hostinger for digivistaco.com and www.
Do not upload certificate files into the theme.

Notes
-----
This theme replaces the normal WordPress front-end with the SellerOS → 2026 portfolio app.
Use the WP admin for hosting/SSL/domain only; the visible site is the portfolio.
`,
)

// Zip: WordPress needs the theme folder as the root entry inside the zip
rmSync(zipPath, { force: true })
execSync(`cd "${join(outDir, '..')}" && zip -r "${zipPath}" "${themeName}" -x "*.DS_Store"`, {
  stdio: 'inherit',
})
mkdirSync('/opt/cursor/artifacts', { recursive: true })
cpSync(zipPath, artifactZip)

console.log('Theme folder:', outDir)
console.log('Zip:', zipPath)
console.log('Artifact:', artifactZip)
console.log('Entry JS:', entryJs)
console.log('Entry CSS:', entryCss)
