<?php
/**
 * Product 3D meta fields.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'woocommerce_product_data_tabs',
	static function ( array $tabs ): array {
		$tabs['jt_3d'] = array(
			'label'    => __( '3D', 'jettribe' ),
			'target'   => 'jt_3d_product_data',
			'class'    => array(),
			'priority' => 70,
		);
		return $tabs;
	}
);

add_action(
	'woocommerce_product_data_panels',
	static function (): void {
		echo '<div id="jt_3d_product_data" class="panel woocommerce_options_panel">';
		woocommerce_wp_text_input(
			array(
				'id'          => '_jt_model_glb',
				'label'       => __( 'GLB URL', 'jettribe' ),
				'desc_tip'    => true,
				'description' => __( 'Optional optimized GLB for the PDP viewer.', 'jettribe' ),
			)
		);
		woocommerce_wp_text_input(
			array(
				'id'          => '_jt_model_poster',
				'label'       => __( 'Model poster URL', 'jettribe' ),
				'desc_tip'    => true,
				'description' => __( 'Shown before WebGL loads; should match viewer aspect.', 'jettribe' ),
			)
		);
		woocommerce_wp_text_input(
			array(
				'id'          => '_jt_accent',
				'label'       => __( 'Accent hex', 'jettribe' ),
				'placeholder' => '#00E5FF',
			)
		);
		woocommerce_wp_textarea_input(
			array(
				'id'          => '_jt_hotspots',
				'label'       => __( 'Hotspots JSON', 'jettribe' ),
				'description' => __( 'Array of { label, text, position: [x,y,z] }.', 'jettribe' ),
			)
		);
		woocommerce_wp_textarea_input(
			array(
				'id'          => '_jt_colorways',
				'label'       => __( 'Colorways JSON', 'jettribe' ),
				'description' => __( 'Map color variation slug to material/texture set.', 'jettribe' ),
			)
		);
		echo '</div>';
	}
);

add_action(
	'woocommerce_process_product_meta',
	static function ( int $post_id ): void {
		$fields = array( '_jt_model_glb', '_jt_model_poster', '_jt_accent', '_jt_hotspots', '_jt_colorways' );
		foreach ( $fields as $field ) {
			if ( ! isset( $_POST[ $field ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				continue;
			}
			$value = wp_unslash( $_POST[ $field ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			if ( in_array( $field, array( '_jt_hotspots', '_jt_colorways' ), true ) ) {
				$value = sanitize_textarea_field( (string) $value );
			} elseif ( '_jt_accent' === $field ) {
				$value = sanitize_hex_color( (string) $value );
			} else {
				$value = esc_url_raw( (string) $value );
			}
			update_post_meta( $post_id, $field, $value );
		}
	}
);
