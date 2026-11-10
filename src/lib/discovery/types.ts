export type DiscoveryCandidate = {
  domain: string;
  title?: string;
  snippet?: string;
  url?: string;
  source: string;
};

export type DiscoverySearchOptions = {
  limit?: number;
  signal?: AbortSignal;
};

export interface DiscoverySource {
  id: string;
  name: string;
  isConfigured(): boolean;
  search(query: string, options?: DiscoverySearchOptions): Promise<DiscoveryCandidate[]>;
}
