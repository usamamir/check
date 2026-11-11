<?php
/**
 * Store API helpers / REST bootstrap for theme JS.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! function_exists( 'WC' ) ) {
			return;
		}
		// Ensure Store API nonce cookie works for logged-out cart mutations.
		if ( ! headers_sent() && function_exists( 'wc_load_cart' ) ) {
			wc_load_cart();
		}
	},
	5
);
