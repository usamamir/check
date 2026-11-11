<?php
/**
 * Create PLACEHOLDER products when no export exists.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Placeholder catalog.
 *
 * @return array<int, array{name:string, category:string, accent:string}>
 */
function jt_placeholder_catalog(): array {
	return array(
		array( 'name' => 'Circuit 2-Piece Wetsuit Set', 'category' => 'Wetsuits', 'accent' => '#00E5FF' ),
		array( 'name' => 'Hyper 2-Piece Wetsuit Set', 'category' => 'Wetsuits', 'accent' => '#FF3B5C' ),
		array( 'name' => 'Hyper Tour Coat', 'category' => 'Tour Coats', 'accent' => '#7CFF6B' ),
		array( 'name' => 'GRB Race Boot', 'category' => 'Footwear', 'accent' => '#FFB020' ),
		array( 'name' => 'Amphib Ride Shoes', 'category' => 'Footwear', 'accent' => '#00E5FF' ),
		array( 'name' => 'GP-40 Gloves', 'category' => 'Gloves', 'accent' => '#A78BFA' ),
		array( 'name' => 'Race Skin PWC Gloves', 'category' => 'Gloves', 'accent' => '#FF3B5C' ),
		array( 'name' => 'Classic Floating Goggles', 'category' => 'Goggles', 'accent' => '#00E5FF' ),
		array( 'name' => 'Hooded Rashguard', 'category' => 'Apparel', 'accent' => '#7CFF6B' ),
		array( 'name' => 'Board Shorts', 'category' => 'Apparel', 'accent' => '#FFB020' ),
		array( 'name' => 'Waterproof Ride Bag', 'category' => 'Bags and Accessories', 'accent' => '#8A97A6' ),
		array( 'name' => 'PWC Cover', 'category' => 'PWC Covers', 'accent' => '#0A4D68' ),
	);
}

/**
 * Category tree from brief.
 *
 * @return array<string, string[]>
 */
function jt_category_tree(): array {
	return array(
		'Wetsuits'              => array( '2-Piece Sets', 'Jackets', 'Johns', 'Ladies' ),
		'Tour Coats'            => array(),
		'Gloves'                => array(),
		'Footwear'              => array( 'Race Boots', 'Ride Shoes', 'Socks' ),
		'Goggles'               => array( 'Goggles', 'Replacement Lenses' ),
		'Apparel'               => array( 'Rashguards', 'Board Shorts', 'Hoodies and Tees', 'Swimwear' ),
		'Protection'            => array( 'Race Belts' ),
		'PWC Covers'            => array(),
		'Bags and Accessories'  => array(),
		'Outlet'                => array(),
	);
}

add_action(
	'admin_init',
	static function (): void {
		if ( ! current_user_can( 'manage_woocommerce' ) || ! function_exists( 'wc_get_product' ) ) {
			return;
		}
		if ( get_option( 'jt_placeholders_seeded' ) ) {
			return;
		}
		if ( ! empty( $_GET['jt_seed_placeholders'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			jt_seed_placeholders();
			update_option( 'jt_placeholders_seeded', 1, false );
		}
	}
);

/**
 * Seed categories and draft placeholder products.
 */
function jt_seed_placeholders(): void {
	foreach ( jt_category_tree() as $parent => $children ) {
		$parent_id = jt_ensure_term( $parent, 0 );
		foreach ( $children as $child ) {
			jt_ensure_term( $child, $parent_id );
		}
	}

	foreach ( jt_placeholder_catalog() as $item ) {
		$existing = get_page_by_title( $item['name'], OBJECT, 'product' ); // phpcs:ignore WordPress.WP.DeprecatedFunctions.get_page_by_titleFound
		if ( $existing ) {
			continue;
		}

		$product_id = wp_insert_post(
			array(
				'post_title'  => $item['name'],
				'post_status' => 'draft',
				'post_type'   => 'product',
				'post_content'=> 'PLACEHOLDER product for theme development. Replace with real Jettribe catalog data.',
			),
			true
		);
		if ( is_wp_error( $product_id ) ) {
			continue;
		}

		wp_set_object_terms( $product_id, 'simple', 'product_type' );
		wp_set_object_terms( $product_id, $item['category'], 'product_cat' );
		update_post_meta( $product_id, '_jt_placeholder', '1' );
		update_post_meta( $product_id, '_jt_accent', $item['accent'] );
		update_post_meta( $product_id, '_visibility', 'visible' );
		update_post_meta( $product_id, '_stock_status', 'instock' );
		update_post_meta( $product_id, '_regular_price', '' );
		update_post_meta( $product_id, '_price', '' );
	}
}

/**
 * Ensure a product_cat term exists.
 *
 * @param string $name   Name.
 * @param int    $parent Parent term ID.
 */
function jt_ensure_term( string $name, int $parent ): int {
	$term = term_exists( $name, 'product_cat' );
	if ( is_array( $term ) && isset( $term['term_id'] ) ) {
		return (int) $term['term_id'];
	}
	$created = wp_insert_term( $name, 'product_cat', array( 'parent' => $parent ) );
	if ( is_wp_error( $created ) ) {
		return 0;
	}
	return (int) $created['term_id'];
}
