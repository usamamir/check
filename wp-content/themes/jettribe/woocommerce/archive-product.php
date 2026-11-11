<?php
/**
 * Shop / category archive.
 *
 * @package Jettribe
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

$accent = '#00E5FF';
if ( is_product_taxonomy() ) {
	$term = get_queried_object();
	if ( $term && isset( $term->term_id ) ) {
		$meta = get_term_meta( (int) $term->term_id, '_jt_accent', true );
		if ( is_string( $meta ) && $meta ) {
			$accent = $meta;
		}
	}
}
?>
<main id="primary" class="jt-main jt-shop-main" style="--accent: <?php echo esc_attr( $accent ); ?>">
	<header class="jt-cat-header" data-jt-caustics>
		<div class="jt-cat-header__caustics" aria-hidden="true"></div>
		<div class="jt-container">
			<?php if ( function_exists( 'woocommerce_breadcrumb' ) ) : ?>
				<?php woocommerce_breadcrumb( array( 'wrap_before' => '<nav class="jt-breadcrumbs" aria-label="Breadcrumb">', 'wrap_after' => '</nav>' ) ); ?>
			<?php endif; ?>
			<h1 data-jt-split><?php woocommerce_page_title(); ?></h1>
			<?php do_action( 'woocommerce_archive_description' ); ?>
		</div>
	</header>

	<div class="jt-container jt-shop-layout">
		<aside class="jt-filters" data-jt-filters>
			<form method="get" action="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>">
				<label>
					<span><?php esc_html_e( 'Sort', 'jettribe' ); ?></span>
					<select name="orderby">
						<option value="menu_order"><?php esc_html_e( 'Featured', 'jettribe' ); ?></option>
						<option value="date"><?php esc_html_e( 'Newest', 'jettribe' ); ?></option>
						<option value="price"><?php esc_html_e( 'Price: low to high', 'jettribe' ); ?></option>
						<option value="price-desc"><?php esc_html_e( 'Price: high to low', 'jettribe' ); ?></option>
					</select>
				</label>
				<label>
					<span><?php esc_html_e( 'In stock', 'jettribe' ); ?></span>
					<input type="checkbox" name="stock" value="1" <?php checked( isset( $_GET['stock'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?> />
				</label>
				<button class="jt-btn jt-btn--ghost" type="submit"><?php esc_html_e( 'Apply', 'jettribe' ); ?></button>
			</form>
			<p class="jt-filters__count" data-jt-result-count></p>
		</aside>

		<section class="jt-shop-results">
			<?php if ( woocommerce_product_loop() ) : ?>
				<?php woocommerce_product_loop_start(); ?>
				<div class="jt-grid jt-grid--products" data-jt-product-grid>
					<?php
					while ( have_posts() ) {
						the_post();
						do_action( 'woocommerce_shop_loop' );
						$product = wc_get_product( get_the_ID() );
						jt_render_product_card( $product );
					}
					?>
				</div>
				<?php woocommerce_product_loop_end(); ?>
				<?php do_action( 'woocommerce_after_shop_loop' ); ?>
			<?php else : ?>
				<?php do_action( 'woocommerce_no_products_found' ); ?>
			<?php endif; ?>
		</section>
	</div>
</main>
<?php
get_footer( 'shop' );
