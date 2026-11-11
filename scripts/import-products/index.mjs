#!/usr/bin/env node
/**
 * Converts assets-source/products/*.csv into WooCommerce CSV.
 * Without an export, writes a PLACEHOLDER Woo CSV for manual import.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = join(root, 'assets-source/products');
const outDir = join(root, 'scripts/import-products/out');
mkdirSync(outDir, { recursive: true });

const placeholders = [
  'Circuit 2-Piece Wetsuit Set',
  'Hyper 2-Piece Wetsuit Set',
  'Hyper Tour Coat',
  'GRB Race Boot',
  'Amphib Ride Shoes',
  'GP-40 Gloves',
  'Race Skin PWC Gloves',
  'Classic Floating Goggles',
  'Hooded Rashguard',
  'Board Shorts',
  'Waterproof Ride Bag',
  'PWC Cover',
];

const files = existsSync(sourceDir) ? readdirSync(sourceDir).filter((f) => f.endsWith('.csv')) : [];
if (!files.length) {
  const rows = [
    ['ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog', 'Short description', 'Description', 'Tax status', 'In stock?', 'Stock', 'Regular price', 'Categories', 'Tags', 'Images', 'Meta: _jt_placeholder', 'Meta: _jt_accent'],
    ...placeholders.map((name, i) => [
      '',
      'simple',
      `JT-PLACEHOLDER-${i + 1}`,
      name,
      '0',
      '0',
      'visible',
      'PLACEHOLDER',
      'PLACEHOLDER product for theme development. Replace with real Jettribe catalog data.',
      'taxable',
      '1',
      '',
      '',
      'Uncategorized',
      'placeholder',
      '',
      '1',
      '#00E5FF',
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
  writeFileSync(join(outDir, 'woocommerce-placeholders.csv'), csv);
  console.log('No product export found. Wrote PLACEHOLDER WooCommerce CSV.');
  console.log(join(outDir, 'woocommerce-placeholders.csv'));
  process.exit(0);
}

console.log('Found export(s):', files.join(', '));
console.log('Map columns explicitly before import — refusing to guess unmapped fields.');
process.exit(0);
