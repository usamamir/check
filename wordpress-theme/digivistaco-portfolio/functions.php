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
  $theme_uri = get_template_directory_uri();
  $theme_dir = get_template_directory();

  $css = 'index-y9PLD4ZS.css';
  $js  = 'index-DSCro8yz.js';

  wp_enqueue_style(
    'digivistaco-fonts',
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&family=Syne:wght@500;600;700;800&display=swap',
    [],
    null
  );

  wp_enqueue_style(
    'digivistaco-app',
    $theme_uri . '/assets/' . $css,
    ['digivistaco-fonts'],
    filemtime($theme_dir . '/assets/' . $css)
  );

  wp_enqueue_script(
    'digivistaco-app',
    $theme_uri . '/assets/' . $js,
    [],
    filemtime($theme_dir . '/assets/' . $js),
    true
  );

  // Vite module scripts need type="module"
  add_filter('script_loader_tag', function ($tag, $handle, $src) {
    if ($handle === 'digivistaco-app') {
      return '<script type="module" src="' . esc_url($src) . '" id="digivistaco-app-js"></script>';
    }
    return $tag;
  }, 10, 3);

  wp_localize_script('digivistaco-app', 'DigivistacoTheme', [
    'themeUrl'   => $theme_uri,
    'photo'      => $theme_uri . '/uzi-mir.jpg',
    'photoThumb' => $theme_uri . '/uzi-mir-thumb.jpg',
  ]);
});

// Hide WP admin bar on front for clean portfolio presentation
add_filter('show_admin_bar', '__return_false');
