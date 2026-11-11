<?php
/**
 * Jettribe theme bootstrap.
 *
 * Front-end JS/CSS are produced by the Vite app in /storefront.
 * Copy storefront/dist/assets into this theme's /assets folder on deploy,
 * or point JT_VITE_DEV_SERVER at the Vite dev URL during local work.
 */

declare(strict_types=1);

add_action('after_setup_theme', function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    register_nav_menus([
        'primary' => __('Primary Menu', 'jettribe'),
        'utility' => __('Utility Menu', 'jettribe'),
        'footer' => __('Footer Menu', 'jettribe'),
    ]);
});

add_action('wp_enqueue_scripts', function (): void {
    $theme_uri = get_template_directory_uri();
    $theme_dir = get_template_directory();

    $dev = defined('JT_VITE_DEV_SERVER') ? JT_VITE_DEV_SERVER : getenv('JT_VITE_DEV_SERVER');
    if ($dev) {
        wp_enqueue_script('jettribe-vite', rtrim((string) $dev, '/') . '/src/main.tsx', [], null, true);
        return;
    }

    $manifest_path = $theme_dir . '/assets/.vite/manifest.json';
    if (!file_exists($manifest_path)) {
        $manifest_path = $theme_dir . '/assets/manifest.json';
    }
    if (file_exists($manifest_path)) {
        $manifest = json_decode((string) file_get_contents($manifest_path), true);
        $entry = $manifest['src/main.tsx'] ?? null;
        if (is_array($entry)) {
            if (!empty($entry['css']) && is_array($entry['css'])) {
                foreach ($entry['css'] as $i => $css) {
                    wp_enqueue_style('jettribe-' . $i, $theme_uri . '/assets/' . ltrim($css, '/'), [], null);
                }
            }
            if (!empty($entry['file'])) {
                wp_enqueue_script('jettribe', $theme_uri . '/assets/' . ltrim($entry['file'], '/'), [], null, true);
            }
        }
    } else {
        wp_enqueue_style('jettribe-style', get_stylesheet_uri(), [], '1.0.0');
    }

    wp_localize_script('jettribe', 'JettribeData', [
        'homeUrl' => home_url('/'),
        'storeApi' => rest_url('wc/store/v1'),
        'nonce' => wp_create_nonce('wc_store_api'),
        'currency' => function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'USD',
    ]);
});

/**
 * Product meta for optional GLB + hotspots (3D viewer).
 */
add_action('init', function (): void {
    register_post_meta('product', '_jt_glb_url', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function () {
            return current_user_can('edit_products');
        },
    ]);
    register_post_meta('product', '_jt_hotspots', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function () {
            return current_user_can('edit_products');
        },
    ]);
});

add_action('add_meta_boxes', function (): void {
    add_meta_box('jt_3d', __('Jettribe 3D Model', 'jettribe'), function (\WP_Post $post): void {
        $glb = get_post_meta($post->ID, '_jt_glb_url', true);
        $hotspots = get_post_meta($post->ID, '_jt_hotspots', true);
        wp_nonce_field('jt_3d_save', 'jt_3d_nonce');
        echo '<p><label>GLB URL<br><input type="url" style="width:100%" name="jt_glb_url" value="' . esc_attr((string) $glb) . '"></label></p>';
        echo '<p><label>Hotspots JSON<br><textarea style="width:100%;min-height:120px" name="jt_hotspots">' . esc_textarea((string) $hotspots) . '</textarea></label></p>';
    }, 'product', 'side');
});

add_action('save_post_product', function (int $post_id): void {
    if (!isset($_POST['jt_3d_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['jt_3d_nonce'])), 'jt_3d_save')) {
        return;
    }
    if (isset($_POST['jt_glb_url'])) {
        update_post_meta($post_id, '_jt_glb_url', esc_url_raw(wp_unslash($_POST['jt_glb_url'])));
    }
    if (isset($_POST['jt_hotspots'])) {
        update_post_meta($post_id, '_jt_hotspots', wp_unslash($_POST['jt_hotspots']));
    }
});
