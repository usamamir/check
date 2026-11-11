<?php
/**
 * 404.
 *
 * @package Jettribe
 */

declare(strict_types=1);

get_header();
?>
<main id="primary" class="jt-main jt-404">
	<section class="jt-404__scene" data-jt-404>
		<div class="jt-container">
			<p class="jt-brand-kicker">Jettribe</p>
			<h1 data-jt-split><?php esc_html_e( 'Off course', 'jettribe' ); ?></h1>
			<p><?php esc_html_e( 'This wake leads nowhere. Head back to the shop and pick your line.', 'jettribe' ); ?></p>
			<a class="jt-btn jt-btn--primary" href="<?php echo esc_url( home_url( '/shop/' ) ); ?>"><?php esc_html_e( 'Back to shop', 'jettribe' ); ?></a>
		</div>
	</section>
</main>
<?php
get_footer();
