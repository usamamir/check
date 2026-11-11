<?php
/**
 * Jettribe theme bootstrap.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JT_THEME_VERSION', '1.0.0' );
define( 'JT_THEME_DIR', get_template_directory() );
define( 'JT_THEME_URI', get_template_directory_uri() );

require_once JT_THEME_DIR . '/inc/setup.php';
require_once JT_THEME_DIR . '/inc/enqueue.php';
require_once JT_THEME_DIR . '/inc/woocommerce.php';
require_once JT_THEME_DIR . '/inc/product-meta.php';
require_once JT_THEME_DIR . '/inc/speculation.php';
require_once JT_THEME_DIR . '/inc/placeholders.php';
require_once JT_THEME_DIR . '/inc/store-api.php';
