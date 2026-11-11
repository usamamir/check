<?php
/**
 * WooCommerce integration.
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
		add_filter(
			'woocommerce_enqueue_styles',
			static function ( $styles ) {
				// Keep smallscreen only; theme owns layout/general look.
				unset( $styles['woocommerce-general'], $styles['woocommerce-layout'] );
				return $styles;
			}
		);

		remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
		remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
		remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

		add_action(
			'woocommerce_before_main_content',
			static function (): void {
				echo '<main id="primary" class="jt-main jt-shop-main"><div class="jt-container">';
			}
		);
		add_action(
			'woocommerce_after_main_content',
			static function (): void {
				echo '</div></main>';
			}
		);
	}
);

add_filter(
	'loop_shop_columns',
	static function (): int {
		return 3;
	}
);

add_filter(
	'loop_shop_per_page',
	static function (): int {
		return 12;
	}
);

/**
 * Product card markup helpers used by Woo loop overrides.
 *
 * @param WC_Product $product Product.
 */
function jt_render_product_card( $product ): void {
	if ( ! $product ) {
		return;
	}

	$accent = get_post_meta( $product->get_id(), '_jt_accent', true );
	$accent = is_string( $accent ) && $accent ? $accent : '#00E5FF';
	$poster = get_post_meta( $product->get_id(), '_jt_model_poster', true );
	$img_id = $product->get_image_id();
	$link   = get_permalink( $product->get_id() );
	$title  = $product->get_name();
	$price  = $product->get_price_html();
	$placeholder = (bool) get_post_meta( $product->get_id(), '_jt_placeholder', true );
	?>
	<article class="jt-card" data-jt-card style="--accent: <?php echo esc_attr( $accent ); ?>">
		<a class="jt-card__media" href="<?php echo esc_url( $link ); ?>" data-jt-shared="product-<?php echo esc_attr( (string) $product->get_id() ); ?>">
			<?php if ( $img_id ) : ?>
				<?php
				echo wp_get_attachment_image(
					(int) $img_id,
					'jt-card',
					false,
					array(
						'class'    => 'jt-card__img',
						'loading'  => 'lazy',
						'decoding' => 'async',
						'alt'      => esc_attr( $title ),
					)
				);
				?>
			<?php elseif ( is_string( $poster ) && $poster ) : ?>
				<img class="jt-card__img" src="<?php echo esc_url( $poster ); ?>" alt="<?php echo esc_attr( $title ); ?>" width="800" height="1000" loading="lazy" decoding="async" />
			<?php else : ?>
				<div class="jt-card__placeholder" aria-hidden="true">
					<span><?php echo esc_html( strtoupper( substr( $title, 0, 2 ) ) ); ?></span>
				</div>
			<?php endif; ?>
			<span class="jt-card__sweep" aria-hidden="true"></span>
		</a>
		<div class="jt-card__body">
			<?php if ( $placeholder ) : ?>
				<span class="jt-badge"><?php esc_html_e( 'PLACEHOLDER', 'jettribe' ); ?></span>
			<?php endif; ?>
			<h3 class="jt-card__title">
				<a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( $title ); ?></a>
			</h3>
			<div class="jt-card__price"><?php echo $price ? wp_kses_post( $price ) : esc_html__( 'Price TBA', 'jettribe' ); ?></div>
			<button
				type="button"
				class="jt-btn jt-btn--ghost jt-card__quick"
				data-jt-quick-add
				data-product-id="<?php echo esc_attr( (string) $product->get_id() ); ?>"
			>
				<?php esc_html_e( 'Quick add', 'jettribe' ); ?>
			</button>
		</div>
	</article>
	<?php
}
