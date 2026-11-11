#!/usr/bin/env node
/**
 * Re-runnable WooCommerce product importer.
 * Reads assets-source/products/products.json and upserts products via WP-CLI
 * inside @wordpress/env (`npx wp-env run cli wp ...`).
 *
 * Usage:
 *   node scripts/import-woocommerce.mjs
 *   node scripts/import-woocommerce.mjs --limit=50
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "assets-source/products/products.json");
const redirectsPath = path.join(root, "assets-source/products/url-redirects.json");

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : null;

const products = JSON.parse(readFileSync(productsPath, "utf8"));
const batch = limit ? products.slice(0, limit) : products;

function wp(args) {
  const res = spawnSync("npx", ["wp-env", "run", "cli", "wp", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error(`wp failed: ${args.join(" ")}`);
  }
  return (res.stdout || "").trim();
}

console.log(`Importing ${batch.length} products into WooCommerce via wp-env...`);

// Ensure WooCommerce is active
try {
  wp(["plugin", "activate", "woocommerce"]);
} catch {
  console.warn("Could not activate WooCommerce — is wp-env running?");
}

const missing = [];

for (const [i, p] of batch.entries()) {
  if (!p.name) {
    missing.push({ reason: "missing name", product: p });
    continue;
  }
  const sku = p.sku || `JT-${p.id || i}`;
  const price = p.sale_price != null ? String(p.sale_price) : p.price != null ? String(p.price) : "";
  const regular = p.price != null ? String(p.price) : price;

  // Upsert by SKU
  let id = "";
  try {
    id = wp(["wc", "product", "list", `--sku=${sku}`, "--field=id", "--format=csv"]).split("\n").pop();
  } catch {
    id = "";
  }

  const baseArgs = [
    "post",
    id ? "update" : "create",
    ...(id ? [id] : []),
    `--post_type=product`,
    `--post_title=${p.name}`,
    `--post_name=${p.slug}`,
    `--post_status=publish`,
    `--post_content=${p.description_html || p.description || ""}`,
    "--porcelain",
  ];

  try {
    const postId = id || wp(baseArgs);
    wp(["post", "meta", "update", postId, "_sku", sku]);
    if (regular) wp(["post", "meta", "update", postId, "_regular_price", regular]);
    if (p.sale_price != null) wp(["post", "meta", "update", postId, "_sale_price", String(p.sale_price)]);
    if (price) wp(["post", "meta", "update", postId, "_price", price]);
    wp(["post", "meta", "update", postId, "_manage_stock", "no"]);
    wp(["post", "meta", "update", postId, "_stock_status", p.in_stock ? "instock" : "outofstock"]);
    wp(["post", "meta", "update", postId, "_jt_old_url", p.old_url || ""]);
    // categories
    for (const cat of p.categories || []) {
      try {
        wp(["wc", "product_cat", "create", `--name=${cat}`, "--porcelain"]);
      } catch {
        /* exists */
      }
      try {
        wp(["post", "term", "add", postId, "product_cat", cat]);
      } catch {
        /* ignore */
      }
    }
    if ((i + 1) % 25 === 0) console.log(`imported ${i + 1}/${batch.length}`);
  } catch (e) {
    missing.push({ reason: String(e), sku, name: p.name });
  }
}

writeFileSync(
  path.join(root, "assets-source/products/import-missing.json"),
  JSON.stringify(missing, null, 2),
);
console.log(`Done. Missing/errors: ${missing.length}. Redirects: ${redirectsPath}`);
console.log("Note: Image sideloading should be added once wp-env + media disk are available.");
