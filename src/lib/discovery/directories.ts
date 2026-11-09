/**
 * TODO(phase-9): Directory adapters for public supplier/wholesale directories
 * whose terms explicitly permit programmatic access. Keep each behind a Settings toggle.
 *
 * Candidates to evaluate (do not enable until ToS review):
 * - Public manufacturer association member lists that allow crawling
 * - Trade-show exhibitor CSV downloads (manual import preferred)
 *
 * Interface sketch:
 *   export interface DirectoryAdapter {
 *     id: string;
 *     name: string;
 *     enabled(): boolean;
 *     search(niche: string): Promise<DiscoveryCandidate[]>;
 *   }
 */

import type { DiscoveryCandidate } from "./types";

export type DirectoryAdapter = {
  id: string;
  name: string;
  enabled: () => boolean;
  search: (niche: string) => Promise<DiscoveryCandidate[]>;
};

/** Placeholder registry — no live directory scrapers ship by default. */
export function getDirectoryAdapters(): DirectoryAdapter[] {
  return [];
}
