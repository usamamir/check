<?php
/**
 * Fallback template — theme is designed around WooCommerce + block-editable pages.
 */
get_header();
?>
<main class="jt-main container" style="padding:48px 24px">
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    <article <?php post_class(); ?>>
      <h1><?php the_title(); ?></h1>
      <div class="entry-content"><?php the_content(); ?></div>
    </article>
  <?php endwhile; else : ?>
    <p><?php esc_html_e('No content found.', 'jettribe'); ?></p>
  <?php endif; ?>
</main>
<?php
get_footer();
