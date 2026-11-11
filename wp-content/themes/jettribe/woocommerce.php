<?php
/**
 * WooCommerce wrapper.
 *
 * @package Jettribe
 */

declare(strict_types=1);

get_header( 'shop' );
?>
<main id="primary" class="jt-main jt-shop-main">
	<div class="jt-container">
		<?php woocommerce_content(); ?>
	</div>
</main>
<?php
get_footer( 'shop' );
