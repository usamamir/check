<?php
/**
 * Page template.
 *
 * @package Jettribe
 */

declare(strict_types=1);

get_header();
?>
<main id="primary" class="jt-main">
	<div class="jt-container jt-page">
		<?php while ( have_posts() ) : ?>
			<?php the_post(); ?>
			<article <?php post_class( 'jt-article' ); ?>>
				<header class="jt-page__head">
					<h1 data-jt-split><?php the_title(); ?></h1>
				</header>
				<div class="jt-prose">
					<?php the_content(); ?>
				</div>
			</article>
		<?php endwhile; ?>
	</div>
</main>
<?php
get_footer();
