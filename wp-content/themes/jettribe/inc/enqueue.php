<?php
/**
 * Asset enqueue via Vite manifest.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Read Vite manifest.
 *
 * @return array<string, array<string, mixed>>
 */
function jt_vite_manifest(): array {
	static $manifest = null;
	if ( null !== $manifest ) {
		return $manifest;
	}

	$path = JT_THEME_DIR . '/dist/.vite/manifest.json';
	if ( ! file_exists( $path ) ) {
		$path = JT_THEME_DIR . '/dist/manifest.json';
	}
	if ( ! file_exists( $path ) ) {
		$manifest = array();
		return $manifest;
	}

	$raw      = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$decoded  = json_decode( (string) $raw, true );
	$manifest = is_array( $decoded ) ? $decoded : array();
	return $manifest;
}

/**
 * Resolve a Vite entry by source path.
 *
 * @param string $entry Source path relative to theme, e.g. src/entries/main.ts.
 * @return array{js:?string,css:string[],imports:string[]}
 */
function jt_vite_entry( string $entry ): array {
	$manifest = jt_vite_manifest();
	$item     = $manifest[ $entry ] ?? null;
	if ( ! is_array( $item ) ) {
		return array(
			'js'      => null,
			'css'     => array(),
			'imports' => array(),
		);
	}

	$css = array();
	if ( ! empty( $item['css'] ) && is_array( $item['css'] ) ) {
		$css = $item['css'];
	}

	$imports = array();
	if ( ! empty( $item['imports'] ) && is_array( $item['imports'] ) ) {
		foreach ( $item['imports'] as $import_key ) {
			if ( isset( $manifest[ $import_key ]['file'] ) ) {
				$imports[] = $manifest[ $import_key ]['file'];
			}
			if ( ! empty( $manifest[ $import_key ]['css'] ) && is_array( $manifest[ $import_key ]['css'] ) ) {
				$css = array_merge( $css, $manifest[ $import_key ]['css'] );
			}
		}
	}

	return array(
		'js'      => isset( $item['file'] ) ? (string) $item['file'] : null,
		'css'     => array_values( array_unique( $css ) ),
		'imports' => $imports,
	);
}

/**
 * Inline critical CSS from file if present.
 */
function jt_print_critical_css(): void {
	$path = JT_THEME_DIR . '/dist/critical.css';
	if ( ! file_exists( $path ) ) {
		$path = JT_THEME_DIR . '/src/styles/critical.css';
	}
	if ( ! file_exists( $path ) ) {
		return;
	}
	$css = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( ! is_string( $css ) || '' === $css ) {
		return;
	}
	echo '<style id="jt-critical">' . $css . '</style>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

add_action( 'wp_head', 'jt_print_critical_css', 1 );

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		$entries = array( 'src/entries/main.ts' );

		if ( is_front_page() ) {
			$entries[] = 'src/entries/home.ts';
		}
		if ( function_exists( 'is_shop' ) && ( is_shop() || is_product_taxonomy() ) ) {
			$entries[] = 'src/entries/shop.ts';
		}
		if ( function_exists( 'is_product' ) && is_product() ) {
			$entries[] = 'src/entries/product.ts';
		}

		$handles = array();
		foreach ( $entries as $entry ) {
			$data = jt_vite_entry( $entry );
			foreach ( $data['css'] as $i => $css_file ) {
				$handle = 'jt-' . sanitize_title( basename( $css_file, '.css' ) ) . '-' . $i;
				wp_enqueue_style(
					$handle,
					JT_THEME_URI . '/dist/' . ltrim( $css_file, '/' ),
					array(),
					JT_THEME_VERSION
				);
				// Non-blocking load pattern for non-critical sheets.
				wp_style_add_data( $handle, 'path', JT_THEME_DIR . '/dist/' . ltrim( $css_file, '/' ) );
			}

			if ( $data['js'] ) {
				$handle = 'jt-' . sanitize_title( basename( (string) $data['js'], '.js' ) );
				wp_enqueue_script(
					$handle,
					JT_THEME_URI . '/dist/' . ltrim( (string) $data['js'], '/' ),
					array(),
					JT_THEME_VERSION,
					array(
						'strategy'  => 'defer',
						'in_footer' => true,
					)
				);
				wp_script_add_data( $handle, 'type', 'module' );
				$handles[] = $handle;
			}
		}

		if ( ! empty( $handles ) ) {
			wp_localize_script(
				$handles[0],
				'JT',
				array(
					'homeUrl'   => home_url( '/' ),
					'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
					'restUrl'   => esc_url_raw( rest_url() ),
					'nonce'     => wp_create_nonce( 'wp_rest' ),
					'cartNonce' => wp_create_nonce( 'wc_store_api' ),
					'themeUri'  => JT_THEME_URI,
					'isShop'    => function_exists( 'is_shop' ) && ( is_shop() || is_product_taxonomy() ),
					'isProduct' => function_exists( 'is_product' ) && is_product(),
					'isHome'    => is_front_page(),
					'currency'  => function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '$',
					'i18n'      => array(
						'added'   => __( 'Added to cart', 'jettribe' ),
						'search'  => __( 'Search gear…', 'jettribe' ),
						'loading' => __( 'Loading…', 'jettribe' ),
					),
				)
			);
		}

		// Dequeue Woo styles/scripts off commerce pages.
		$needs_woo = function_exists( 'is_woocommerce' ) && ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() );
		if ( ! $needs_woo ) {
			wp_dequeue_style( 'woocommerce-general' );
			wp_dequeue_style( 'woocommerce-layout' );
			wp_dequeue_style( 'woocommerce-smallscreen' );
			wp_dequeue_script( 'wc-cart-fragments' );
		}
	},
	20
);

/**
 * Force type="module" on theme scripts.
 *
 * @param string $tag    Script tag.
 * @param string $handle Handle.
 * @param string $src    Source.
 */
add_filter(
	'script_loader_tag',
	static function ( string $tag, string $handle, string $src ): string {
		if ( 0 === strpos( $handle, 'jt-' ) && false === strpos( $tag, 'type=' ) ) {
			$tag = '<script type="module" src="' . esc_url( $src ) . '" id="' . esc_attr( $handle ) . '-js" defer></script>' . "\n";
		}
		return $tag;
	},
	10,
	3
);
