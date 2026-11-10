import { getAllSettings } from "@/lib/db/settings";
import type { Lead, Contact, Product } from "@/lib/db/schema";

export type TemplateVars = Record<string, string>;

export function buildTemplateVars(opts: {
  lead: Lead;
  contacts: Contact[];
  products: Product[];
}): TemplateVars {
  const settings = getAllSettings();
  const owner = opts.contacts.find((c) => c.kind === "owner");
  const firstName = owner?.personName?.split(" ")[0] || "there";
  const productExample = opts.products[0]?.title || opts.lead.categories || opts.lead.niche || "your products";

  return {
    company: opts.lead.companyName || opts.lead.domain,
    ownerFirstName: firstName,
    niche: opts.lead.niche || "your niche",
    myStoreName: settings.my_store_name || "My Store",
    myBusinessName: settings.my_business_name || "My Store",
    myMarketplaces: settings.my_marketplaces || "Shopify, Amazon",
    myPhysicalAddress: settings.my_physical_address || "",
    myOptOutLine: settings.my_opt_out_line || 'Reply "unsubscribe" to opt out.',
    productExample: typeof productExample === "string" ? productExample : "your products",
  };
}

export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}
