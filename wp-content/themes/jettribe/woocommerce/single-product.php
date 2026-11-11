<?php
/**
 * Single product.
 *
 * @package Jettribe
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

while ( have_posts() ) {
	the_post();
	global $product;
	if ( ! $product ) {
		$product = wc_get_product( get_the_ID() );
	}

	$accent  = get_post_meta( get_the_ID(), '_jt_accent', true );
	$accent  = is_string( $accent ) && $accent ? $accent : '#00E5FF';
	$glb     = get_post_meta( get_the_ID(), '_jt_model_glb', true );
	$poster  = get_post_meta( get_the_ID(), '_jt_model_poster', true );
	$img_id  = $product ? $product->get_image_id() : 0;
	$poster_url = is_string( $poster ) && $poster ? $poster : ( $img_id ? wp_get_attachment_image_url( (int) $img_id, 'jt-poster' ) : JT_THEME_URI . '/assets/product-poster.svg' );
	?>
	<main id="primary" class="jt-main jt-pdp" style="--accent: <?php echo esc_attr( $accent ); ?>">
		<div class="jt-container">
			<?php woocommerce_breadcrumb( array( 'wrap_before' => '<nav class="jt-breadcrumbs" aria-label="Breadcrumb">', 'wrap_after' => '</nav>' ) ); ?>
			<div class="jt-pdp__layout">
				<section class="jt-pdp__viewer" data-jt-pdp-viewer data-glb="<?php echo esc_attr( is_string( $glb ) ? $glb : '' ); ?>">
					<img
						class="jt-pdp__poster"
						src="<?php echo esc_url( $poster_url ? $poster_url : JT_THEME_URI . '/assets/product-poster.svg' ); ?>"
						alt="<?php the_title_attribute(); ?>"
						width="1200"
						height="1200"
						fetchpriority="high"
						decoding="async"
						data-jt-shared="product-<?php the_ID(); ?>"
					/>
					<canvas class="jt-pdp__canvas" data-jt-pdp-canvas aria-hidden="true" hidden></canvas>
					<p class="screen-reader-text"><?php esc_html_e( '3D product viewer. Use arrow keys to rotate and plus/minus to zoom when focused.', 'jettribe' ); ?></p>
					<div class="jt-pdp__viewer-controls" hidden data-jt-viewer-controls>
						<button type="button" data-jt-viewer-left aria-label="<?php esc_attr_e( 'Rotate left', 'jettribe' ); ?>">←</button>
						<button type="button" data-jt-viewer-right aria-label="<?php esc_attr_e( 'Rotate right', 'jettribe' ); ?>">→</button>
						<button type="button" data-jt-viewer-zoom-in aria-label="<?php esc_attr_e( 'Zoom in', 'jettribe' ); ?>">+</button>
						<button type="button" data-jt-viewer-zoom-out aria-label="<?php esc_attr_e( 'Zoom out', 'jettribe' ); ?>">−</button>
					</div>
				</section>

				<section class="jt-pdp__buy">
					<?php if ( get_post_meta( get_the_ID(), '_jt_placeholder', true ) ) : ?>
						<span class="jt-badge"><?php esc_html_e( 'PLACEHOLDER', 'jettribe' ); ?></span>
					<?php endif; ?>
					<h1 data-jt-split><?php the_title(); ?></h1>
					<div class="jt-pdp__price"><?php echo $product ? wp_kses_post( $product->get_price_html() ) : esc_html__( 'Price TBA', 'jettribe' ); ?></div>
					<?php woocommerce_template_single_add_to_cart(); ?>
					<ul class="jt-pdp__meta">
						<li><?php esc_html_e( 'Ships in 2–4 business days', 'jettribe' ); ?></li>
						<li><?php esc_html_e( 'Free returns within 30 days on unused gear', 'jettribe' ); ?></li>
						<li><a href="<?php echo esc_url( home_url( '/size-guide/' ) ); ?>" data-jt-size-guide><?php esc_html_e( 'Size guide', 'jettribe' ); ?></a></li>
					</ul>
				</section>
			</div>

			<section class="jt-pdp__details">
				<details open>
					<summary><?php esc_html_e( 'Description', 'jettribe' ); ?></summary>
					<div class="jt-prose"><?php the_content(); ?></div>
				</details>
				<details>
					<summary><?php esc_html_e( 'Specs & care', 'jettribe' ); ?></summary>
					<div class="jt-prose"><?php esc_html_e( 'Replace with real product specs from the catalog export.', 'jettribe' ); ?></div>
				</details>
			</section>

			<section class="jt-section">
				<h2><?php esc_html_e( 'Complete the kit', 'jettribe' ); ?></h2>
				<?php woocommerce_output_related_products(); ?>
			</section>
		</div>

		<div class="jt-buybar" data-jt-buybar hidden>
			<div class="jt-container jt-buybar__inner">
				<strong><?php the_title(); ?></strong>
				<span class="jt-pdp__price"><?php echo $product ? wp_kses_post( $product->get_price_html() ) : ''; ?></span>
				<button type="button" class="jt-btn jt-btn--primary" data-jt-buybar-add><?php esc_html_e( 'Add to cart', 'jettribe' ); ?></button>
			</div>
		</div>
	</main>
	<?php
}

get_footer( 'shop' );
