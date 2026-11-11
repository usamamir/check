<?php
/**
 * Search results.
 *
 * @package Jettribe
 */

declare(strict_types=1);

get_header();
?>
<main id="primary" class="jt-main">
	<div class="jt-container jt-page">
		<header class="jt-page__head">
			<h1 data-jt-split>
				<?php
				printf(
					/* translators: %s search query */
					esc_html__( 'Results for “%s”', 'jettribe' ),
					esc_html( get_search_query() )
				);
				?>
			</h1>
		</header>
		<div class="jt-grid jt-grid--products">
			<?php if ( have_posts() ) : ?>
				<?php while ( have_posts() ) : ?>
					<?php
					the_post();
					if ( 'product' === get_post_type() && function_exists( 'wc_get_product' ) ) {
						jt_render_product_card( wc_get_product( get_the_ID() ) );
					}
					?>
				<?php endwhile; ?>
			<?php else : ?>
				<p><?php esc_html_e( 'No products matched that search.', 'jettribe' ); ?></p>
			<?php endif; ?>
		</div>
	</div>
</main>
<?php
get_footer();
