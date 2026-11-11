<?php
/**
 * Speculative loading configuration.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Prefer prerender with moderate eagerness; exclude cart/checkout/account/add-to-cart.
 *
 * @param string $mode Mode.
 */
add_filter(
	'wp_speculation_rules_configuration',
	static function ( $config ) {
		if ( ! is_array( $config ) ) {
			$config = array();
		}
		$config['mode']      = 'prerender';
		$config['eagerness'] = 'moderate';
		return $config;
	}
);

add_filter(
	'wp_speculation_rules_href_exclude_paths',
	static function ( array $paths ): array {
		$paths[] = '/cart/*';
		$paths[] = '/checkout/*';
		$paths[] = '/my-account/*';
		$paths[] = '/*add-to-cart=*';
		$paths[] = '/wp-admin/*';
		return $paths;
	}
);
