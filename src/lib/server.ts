import { ensureWorkerStarted } from "@/lib/jobs/worker";

export function bootServer() {
  ensureWorkerStarted();
}
