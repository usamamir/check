export type Platform =
  | "shopify"
  | "woocommerce"
  | "bigcommerce"
  | "magento"
  | "wix"
  | "squarespace"
  | "custom"
  | "unknown";

export function detectPlatform(html: string, headers?: Record<string, string>): Platform {
  const h = html.toLowerCase();
  const headerStr = JSON.stringify(headers ?? {}).toLowerCase();

  if (
    h.includes("cdn.shopify.com") ||
    h.includes("shopify.theme") ||
    h.includes("shopify-section") ||
    h.includes("myshopify.com") ||
    headerStr.includes("x-shopify")
  ) {
    return "shopify";
  }
  if (
    h.includes("woocommerce") ||
    h.includes("wp-content/plugins/woocommerce") ||
    h.includes("wc-block")
  ) {
    return "woocommerce";
  }
  if (h.includes("cdn.bigcommerce.com") || h.includes("bigcommerce")) {
    return "bigcommerce";
  }
  if (h.includes("mage/cookies") || h.includes("magento") || h.includes("mage-init")) {
    return "magento";
  }
  if (h.includes("static.wixstatic.com") || h.includes("wix.com")) {
    return "wix";
  }
  if (h.includes("squarespace.com") || h.includes("sqsp.net") || h.includes("squarespace-cdn")) {
    return "squarespace";
  }
  return "unknown";
}
