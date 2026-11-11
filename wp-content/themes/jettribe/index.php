<?php
/**
 * Fallback index.
 *
 * @package Jettribe
 */

declare(strict_types=1);

get_header();
?>
<main id="primary" class="jt-main">
	<div class="jt-container jt-page">
		<?php if ( have_posts() ) : ?>
			<?php while ( have_posts() ) : ?>
				<?php the_post(); ?>
				<article <?php post_class( 'jt-article' ); ?>>
					<h1><?php the_title(); ?></h1>
					<?php the_content(); ?>
				</article>
			<?php endwhile; ?>
		<?php else : ?>
			<h1><?php esc_html_e( 'Nothing found', 'jettribe' ); ?></h1>
		<?php endif; ?>
	</div>
</main>
<?php
get_footer();
