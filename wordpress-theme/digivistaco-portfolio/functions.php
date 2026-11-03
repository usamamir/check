<?php
/**
 * Digivistaco Portfolio theme
 * Version: 1.1.0
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('after_setup_theme', function () {
  add_theme_support('title-tag');
});

add_action('wp_enqueue_scripts', function () {
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

  $css = 'style-DZZo6RKu.css';
  $js  = 'index-CouYhlQ_.js';

  wp_enqueue_style(
    'digivistaco-fonts',
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&family=Syne:wght@500;600;700;800&display=swap',
    [],
    null
  );

  // No ?ver= — query strings can break module URL resolution on some hosts
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

  // WP 6.3+ native module support
  wp_script_add_data('digivistaco-app', 'type', 'module');

  // Absolute theme root for any remaining dynamic imports (must end with /)
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

  // Fallback for hosts that strip type from wp_script_add_data
  add_filter('script_loader_tag', function ($tag, $handle, $src) {
    if ($handle !== 'digivistaco-app') {
      return $tag;
    }
    if (strpos($tag, 'type=') === false) {
      $tag = str_replace(
        '<script ',
        '<script type="module" crossorigin ',
        $tag
      );
    }
    return $tag;
  }, 10, 3);
}, 20);

add_filter('show_admin_bar', '__return_false');

add_filter('litespeed_optimize_js_excludes', function ($excludes) {
  $excludes[] = 'digivistaco-app';
  $excludes[] = 'index-';
  return $excludes;
});

add_filter('litespeed_optimize_css_excludes', function ($excludes) {
  $excludes[] = 'digivistaco-app';
  $excludes[] = 'index-';
  return $excludes;
});
