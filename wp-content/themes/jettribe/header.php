<?php
/**
 * Header.
 *
 * @package Jettribe
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
	<style>@view-transition { navigation: auto; }</style>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="jt-skip" href="#primary"><?php esc_html_e( 'Skip to content', 'jettribe' ); ?></a>
<div class="jt-cursor" data-jt-cursor hidden aria-hidden="true"></div>
<header class="jt-header" data-jt-header>
	<div class="jt-header__bar jt-container">
		<button class="jt-icon-btn jt-header__menu-btn" type="button" data-jt-menu-open aria-expanded="false" aria-controls="jt-mobile-nav">
			<span class="screen-reader-text"><?php esc_html_e( 'Open menu', 'jettribe' ); ?></span>
			<span aria-hidden="true"></span><span aria-hidden="true"></span>
		</button>

		<a class="jt-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" data-jt-shared="logo">
			<span class="jt-logo__mark" aria-hidden="true">JT</span>
			<span class="jt-logo__text">Jettribe</span>
		</a>

		<nav class="jt-nav" aria-label="<?php esc_attr_e( 'Primary', 'jettribe' ); ?>" data-jt-mega>
			<button class="jt-nav__link jt-nav__shop" type="button" data-jt-mega-toggle aria-expanded="false" aria-controls="jt-mega">
				<?php esc_html_e( 'Shop', 'jettribe' ); ?>
			</button>
			<a class="jt-nav__link" href="<?php echo esc_url( home_url( '/about/' ) ); ?>"><?php esc_html_e( 'Race Team', 'jettribe' ); ?></a>
			<a class="jt-nav__link" href="<?php echo esc_url( home_url( '/dealers/' ) ); ?>"><?php esc_html_e( 'Dealers', 'jettribe' ); ?></a>
			<a class="jt-nav__link" href="<?php echo esc_url( home_url( '/support/' ) ); ?>"><?php esc_html_e( 'Support', 'jettribe' ); ?></a>
		</nav>

		<div class="jt-header__actions">
			<button class="jt-icon-btn" type="button" data-jt-search-open aria-expanded="false" aria-controls="jt-search">
				<span class="screen-reader-text"><?php esc_html_e( 'Search', 'jettribe' ); ?></span>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
			</button>
			<a class="jt-icon-btn" href="<?php echo esc_url( function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : home_url( '/my-account/' ) ); ?>">
				<span class="screen-reader-text"><?php esc_html_e( 'Account', 'jettribe' ); ?></span>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 19c1.8-3.2 4.2-4.5 7-4.5s5.2 1.3 7 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
			</a>
			<button class="jt-icon-btn jt-cart-btn" type="button" data-jt-cart-open aria-expanded="false" aria-controls="jt-cart-drawer">
				<span class="screen-reader-text"><?php esc_html_e( 'Cart', 'jettribe' ); ?></span>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h2l1.4 9.2a2 2 0 0 0 2 1.8h7.3a2 2 0 0 0 2-1.6L20 8H8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<span class="jt-cart-count" data-jt-cart-count>0</span>
			</button>
		</div>
	</div>

	<div id="jt-mega" class="jt-mega" data-jt-mega-panel hidden>
		<div class="jt-container jt-mega__grid">
			<div class="jt-mega__cats" data-jt-mega-cats>
				<?php
				$cats = function_exists( 'jt_category_tree' ) ? jt_category_tree() : array();
				foreach ( $cats as $parent => $children ) :
					$term = get_term_by( 'name', $parent, 'product_cat' );
					$url  = $term && ! is_wp_error( $term ) ? get_term_link( $term ) : home_url( '/shop/' );
					?>
					<a class="jt-mega__cat" href="<?php echo esc_url( is_string( $url ) ? $url : home_url( '/shop/' ) ); ?>" data-cat="<?php echo esc_attr( $parent ); ?>">
						<span><?php echo esc_html( $parent ); ?></span>
						<?php if ( $children ) : ?>
							<small><?php echo esc_html( implode( ' · ', $children ) ); ?></small>
						<?php endif; ?>
					</a>
				<?php endforeach; ?>
			</div>
			<div class="jt-mega__feature" data-jt-mega-feature>
				<p class="jt-mega__feature-label"><?php esc_html_e( 'Featured', 'jettribe' ); ?></p>
				<div class="jt-mega__feature-card">
					<div class="jt-mega__feature-media" aria-hidden="true"></div>
					<strong data-jt-mega-feature-title><?php esc_html_e( 'Circuit 2-Piece Wetsuit', 'jettribe' ); ?></strong>
					<span><?php esc_html_e( 'Race-ready stretch and spray protection.', 'jettribe' ); ?></span>
				</div>
			</div>
		</div>
	</div>
</header>

<div id="jt-mobile-nav" class="jt-mobile" data-jt-mobile hidden>
	<div class="jt-mobile__panel">
		<button type="button" class="jt-icon-btn jt-mobile__close" data-jt-menu-close>
			<span class="screen-reader-text"><?php esc_html_e( 'Close menu', 'jettribe' ); ?></span>
			×
		</button>
		<nav aria-label="<?php esc_attr_e( 'Mobile', 'jettribe' ); ?>">
			<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>"><?php esc_html_e( 'Shop all', 'jettribe' ); ?></a>
			<?php foreach ( function_exists( 'jt_category_tree' ) ? array_keys( jt_category_tree() ) : array() as $parent ) : ?>
				<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>"><?php echo esc_html( $parent ); ?></a>
			<?php endforeach; ?>
			<a href="<?php echo esc_url( home_url( '/about/' ) ); ?>"><?php esc_html_e( 'Race Team', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/dealers/' ) ); ?>"><?php esc_html_e( 'Dealers', 'jettribe' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/support/' ) ); ?>"><?php esc_html_e( 'Support', 'jettribe' ); ?></a>
		</nav>
	</div>
</div>

<div id="jt-search" class="jt-search" data-jt-search hidden>
	<div class="jt-search__panel jt-container">
		<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="screen-reader-text" for="jt-search-input"><?php esc_html_e( 'Search products', 'jettribe' ); ?></label>
			<input id="jt-search-input" type="search" name="s" placeholder="<?php esc_attr_e( 'Search gear…', 'jettribe' ); ?>" data-jt-search-input autocomplete="off" />
			<input type="hidden" name="post_type" value="product" />
			<button type="button" class="jt-icon-btn" data-jt-search-close>×</button>
		</form>
		<div class="jt-search__results" data-jt-search-results aria-live="polite"></div>
	</div>
</div>

<aside id="jt-cart-drawer" class="jt-cart" data-jt-cart hidden aria-label="<?php esc_attr_e( 'Cart', 'jettribe' ); ?>">
	<div class="jt-cart__backdrop" data-jt-cart-close></div>
	<div class="jt-cart__panel" role="dialog" aria-modal="true">
		<header class="jt-cart__head">
			<h2><?php esc_html_e( 'Your cart', 'jettribe' ); ?></h2>
			<button type="button" class="jt-icon-btn" data-jt-cart-close>×</button>
		</header>
		<div class="jt-cart__items" data-jt-cart-items></div>
		<footer class="jt-cart__foot">
			<div class="jt-cart__subtotal">
				<span><?php esc_html_e( 'Subtotal', 'jettribe' ); ?></span>
				<strong data-jt-cart-subtotal>—</strong>
			</div>
			<a class="jt-btn jt-btn--primary" href="<?php echo esc_url( function_exists( 'wc_get_checkout_url' ) ? wc_get_checkout_url() : home_url( '/checkout/' ) ); ?>"><?php esc_html_e( 'Checkout', 'jettribe' ); ?></a>
			<a class="jt-btn jt-btn--ghost" href="<?php echo esc_url( function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : home_url( '/cart/' ) ); ?>"><?php esc_html_e( 'View cart', 'jettribe' ); ?></a>
		</footer>
	</div>
</aside>

<div class="jt-toast-region" data-jt-toasts aria-live="polite" aria-atomic="true"></div>
