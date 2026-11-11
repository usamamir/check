<?php
/**
 * Theme supports and menus.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'after_setup_theme',
	static function (): void {
		load_theme_textdomain( 'jettribe', JT_THEME_DIR . '/languages' );

		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support(
			'html5',
			array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' )
		);
		add_theme_support( 'custom-logo', array( 'height' => 80, 'width' => 240, 'flex-height' => true, 'flex-width' => true ) );
		add_theme_support( 'align-wide' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'woocommerce' );
		add_theme_support( 'wc-product-gallery-zoom' );
		add_theme_support( 'wc-product-gallery-lightbox' );
		add_theme_support( 'wc-product-gallery-slider' );

		register_nav_menus(
			array(
				'primary'   => __( 'Primary', 'jettribe' ),
				'footer'    => __( 'Footer', 'jettribe' ),
				'mega-shop' => __( 'Shop mega menu', 'jettribe' ),
			)
		);

		add_image_size( 'jt-card', 800, 1000, true );
		add_image_size( 'jt-hero', 1920, 1080, true );
		add_image_size( 'jt-poster', 1200, 1200, true );
	}
);

add_filter(
	'body_class',
	static function ( array $classes ): array {
		$classes[] = 'jt-theme';
		if ( function_exists( 'is_woocommerce' ) && ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() ) ) {
			$classes[] = 'jt-commerce';
		}
		return $classes;
	}
);
