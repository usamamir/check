<?php
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

  $css = 'index-y9PLD4ZS.css';
  $js  = 'index-Bm_-9Gfd.js';

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
      return '<script type="module" crossorigin src="' . esc_url($src) . '" id="digivistaco-app-js"></script>' . "
";
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
