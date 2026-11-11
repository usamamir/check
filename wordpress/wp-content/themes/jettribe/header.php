<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<!-- Full Nike-style header ships via the Vite storefront bundle / React islands.
     Until the bundle is enqueued, keep a minimal accessible landmark. -->
<a class="sr-only" href="#main">Skip to content</a>
