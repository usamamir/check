<?php
/**
 * Footer.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<footer class="jt-footer" data-jt-footer>
	<svg class="jt-footer__wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" data-jt-footer-wave>
		<path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="currentColor"/>
	</svg>
	<div class="jt-container jt-footer__grid">
		<div>
			<a class="jt-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<span class="jt-logo__mark" aria-hidden="true">JT</span>
				<span class="jt-logo__text">Jettribe</span>
			</a>
			<p><?php esc_html_e( 'Ride and race gear built for personal watercraft. Speed, spray, and race-day energy.', 'jettribe' ); ?></p>
		</div>
		<div>
			<h2><?php esc_html_e( 'Shop', 'jettribe' ); ?></h2>
			<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>"><?php esc_html_e( 'All gear', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/product-category/wetsuits/' ) ); ?>"><?php esc_html_e( 'Wetsuits', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/product-category/footwear/' ) ); ?>"><?php esc_html_e( 'Footwear', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/product-category/gloves/' ) ); ?>"><?php esc_html_e( 'Gloves', 'jettribe' ); ?></a>
		</div>
		<div>
			<h2><?php esc_html_e( 'Support', 'jettribe' ); ?></h2>
			<a href="<?php echo esc_url( home_url( '/size-guide/' ) ); ?>"><?php esc_html_e( 'Size guide', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/dealers/' ) ); ?>"><?php esc_html_e( 'Dealers', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/support/' ) ); ?>"><?php esc_html_e( 'Contact', 'jettribe' ); ?></a>
		</div>
		<div>
			<h2><?php esc_html_e( 'Newsletter', 'jettribe' ); ?></h2>
			<form class="jt-newsletter" action="#" method="post" data-jt-newsletter>
				<label class="jt-field">
					<span><?php esc_html_e( 'Email', 'jettribe' ); ?></span>
					<input type="email" name="email" required placeholder="you@email.com" />
				</label>
				<button class="jt-btn jt-btn--primary" type="submit"><?php esc_html_e( 'Join', 'jettribe' ); ?></button>
			</form>
		</div>
	</div>
	<div class="jt-container jt-footer__legal">
		<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> Jettribe. <?php esc_html_e( 'All rights reserved.', 'jettribe' ); ?></p>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
