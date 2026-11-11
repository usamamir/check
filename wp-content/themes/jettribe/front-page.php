<?php
/**
 * Front page — Water Line hero + store sections.
 *
 * @package Jettribe
 */

declare(strict_types=1);

get_header();

$hero_poster = JT_THEME_URI . '/assets/hero-poster.svg';
?>
<main id="primary" class="jt-main jt-home">
	<section class="jt-hero" data-jt-hero data-jt-3d="water-line">
		<div class="jt-hero__stage">
			<img
				class="jt-hero__poster"
				src="<?php echo esc_url( $hero_poster ); ?>"
				alt="<?php esc_attr_e( 'Jettribe race gear above open water', 'jettribe' ); ?>"
				width="1920"
				height="1080"
				fetchpriority="high"
				decoding="async"
				data-jt-hero-poster
			/>
			<canvas class="jt-hero__canvas" data-jt-hero-canvas aria-hidden="true" hidden></canvas>
		</div>
		<div class="jt-hero__content jt-container">
			<p class="jt-brand-kicker" data-jt-reveal>Jettribe</p>
			<h1 class="jt-hero__title" data-jt-split>Built for the water line</h1>
			<p class="jt-hero__lede" data-jt-reveal>Ride and race gear engineered for spray, speed, and the next heat.</p>
			<div class="jt-hero__cta" data-jt-reveal>
				<a class="jt-btn jt-btn--primary" href="<?php echo esc_url( home_url( '/shop/' ) ); ?>" data-jt-magnetic><?php esc_html_e( 'Shop gear', 'jettribe' ); ?></a>
			</div>
		</div>
		<div class="jt-hero__scroll" aria-hidden="true"><span></span></div>
	</section>

	<section class="jt-section jt-cats" data-jt-section>
		<div class="jt-container">
			<header class="jt-section__head">
				<h2 data-jt-split><?php esc_html_e( 'Shop by category', 'jettribe' ); ?></h2>
				<p><?php esc_html_e( 'Find any piece of kit in three clicks or fewer.', 'jettribe' ); ?></p>
			</header>
			<div class="jt-cats__rail" data-jt-cat-rail>
				<?php
				$cats = array( 'Wetsuits', 'Tour Coats', 'Footwear', 'Gloves', 'Goggles', 'Apparel', 'Bags and Accessories', 'PWC Covers' );
				foreach ( $cats as $cat ) :
					$term = get_term_by( 'name', $cat, 'product_cat' );
					$url  = ( $term && ! is_wp_error( $term ) ) ? get_term_link( $term ) : home_url( '/shop/' );
					?>
					<a class="jt-cats__card" href="<?php echo esc_url( is_string( $url ) ? $url : home_url( '/shop/' ) ); ?>">
						<span><?php echo esc_html( $cat ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="jt-section jt-featured" data-jt-pin-story>
		<div class="jt-container jt-featured__grid">
			<div class="jt-featured__copy">
				<p class="jt-eyebrow"><?php esc_html_e( 'Series', 'jettribe' ); ?></p>
				<h2 data-jt-split><?php esc_html_e( 'Hyper collection', 'jettribe' ); ?></h2>
				<p><?php esc_html_e( 'Stretch panels, sealed seams, and colorways that cut through spray. Scroll to walk the set.', 'jettribe' ); ?></p>
				<a class="jt-btn jt-btn--ghost" href="<?php echo esc_url( home_url( '/shop/' ) ); ?>"><?php esc_html_e( 'Explore Hyper', 'jettribe' ); ?></a>
			</div>
			<div class="jt-featured__stage" data-jt-featured-stage>
				<div class="jt-featured__swatch" style="--accent:#FF3B5C"></div>
				<div class="jt-featured__swatch" style="--accent:#00E5FF"></div>
				<div class="jt-featured__swatch" style="--accent:#7CFF6B"></div>
			</div>
		</div>
	</section>

	<section class="jt-section">
		<div class="jt-container">
			<header class="jt-section__head">
				<h2 data-jt-split><?php esc_html_e( 'Best sellers', 'jettribe' ); ?></h2>
				<p><?php esc_html_e( 'Race-proven pieces riders re-order every season.', 'jettribe' ); ?></p>
			</header>
			<div class="jt-grid jt-grid--products" data-jt-product-grid>
				<?php
				if ( function_exists( 'wc_get_products' ) ) {
					$products = wc_get_products(
						array(
							'limit'  => 6,
							'status' => array( 'publish', 'draft' ),
							'orderby'=> 'date',
						)
					);
					foreach ( $products as $product ) {
						jt_render_product_card( $product );
					}
				} else {
					foreach ( jt_placeholder_catalog() as $i => $item ) {
						?>
						<article class="jt-card" data-jt-card style="--accent: <?php echo esc_attr( $item['accent'] ); ?>">
							<a class="jt-card__media" href="<?php echo esc_url( home_url( '/shop/' ) ); ?>">
								<div class="jt-card__placeholder" aria-hidden="true"><span><?php echo esc_html( strtoupper( substr( $item['name'], 0, 2 ) ) ); ?></span></div>
							</a>
							<div class="jt-card__body">
								<span class="jt-badge"><?php esc_html_e( 'PLACEHOLDER', 'jettribe' ); ?></span>
								<h3 class="jt-card__title"><?php echo esc_html( $item['name'] ); ?></h3>
								<div class="jt-card__price"><?php esc_html_e( 'Price TBA', 'jettribe' ); ?></div>
							</div>
						</article>
						<?php
					}
				}
				?>
			</div>
		</div>
	</section>

	<section class="jt-section jt-story">
		<div class="jt-container jt-story__grid">
			<div>
				<h2 data-jt-split><?php esc_html_e( 'Built for racing', 'jettribe' ); ?></h2>
				<p><?php esc_html_e( 'From closed-course heat starts to long-distance touring, Jettribe kit is cut for mobility under load and visibility in spray.', 'jettribe' ); ?></p>
			</div>
			<ul class="jt-stats" data-jt-stats>
				<li><strong data-jt-count=" thr">40</strong><span><?php esc_html_e( 'Years of PWC focus', 'jettribe' ); ?></span></li>
				<li><strong data-jt-count="thr">360</strong><span><?php esc_html_e( 'Degree stretch panels', 'jettribe' ); ?></span></li>
				<li><strong data-jt-count="thr">100</strong><span><?php esc_html_e( 'Percent water-tested', 'jettribe' ); ?></span></li>
			</ul>
		</div>
	</section>

	<section class="jt-section jt-kit">
		<div class="jt-container">
			<header class="jt-section__head">
				<h2 data-jt-split><?php esc_html_e( 'Complete the kit', 'jettribe' ); ?></h2>
				<p><?php esc_html_e( 'Wetsuit, boots, gloves, goggles — one outfit for the next session.', 'jettribe' ); ?></p>
			</header>
			<div class="jt-kit__strip">
				<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>">Wetsuit</a>
				<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>">Boots</a>
				<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>">Gloves</a>
				<a href="<?php echo esc_url( home_url( '/shop/' ) ); ?>">Goggles</a>
			</div>
		</div>
	</section>

	<section class="jt-section jt-cta-band">
		<div class="jt-container jt-cta-band__inner">
			<h2 data-jt-split><?php esc_html_e( 'Find a dealer', 'jettribe' ); ?></h2>
			<p><?php esc_html_e( 'Get fitted in person or ship race-day ready gear to your dock.', 'jettribe' ); ?></p>
			<div class="jt-hero__cta">
				<a class="jt-btn jt-btn--primary" href="<?php echo esc_url( home_url( '/dealers/' ) ); ?>"><?php esc_html_e( 'Dealer locator', 'jettribe' ); ?></a>
				<a class="jt-btn jt-btn--ghost" href="<?php echo esc_url( home_url( '/support/' ) ); ?>"><?php esc_html_e( 'Contact support', 'jettribe' ); ?></a>
			</div>
		</div>
	</section>
</main>
<?php
get_footer();
