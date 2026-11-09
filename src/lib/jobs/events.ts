type Listener = (event: JobEvent) => void;

export type JobEvent = {
  type: "log" | "progress" | "status" | "job";
  jobId?: string;
  message?: string;
  data?: Record<string, unknown>;
  ts: number;
};

const globalForEvents = globalThis as unknown as {
  __supplyscoutListeners?: Set<Listener>;
  __supplyscoutRecent?: JobEvent[];
};

function listeners() {
  if (!globalForEvents.__supplyscoutListeners) {
    globalForEvents.__supplyscoutListeners = new Set();
  }
  return globalForEvents.__supplyscoutListeners;
}

function recent() {
  if (!globalForEvents.__supplyscoutRecent) {
    globalForEvents.__supplyscoutRecent = [];
  }
  return globalForEvents.__supplyscoutRecent;
}

export function emitJobEvent(event: Omit<JobEvent, "ts"> & { ts?: number }) {
  const full: JobEvent = { ...event, ts: event.ts ?? Date.now() };
  const buf = recent();
  buf.push(full);
  if (buf.length > 200) buf.splice(0, buf.length - 200);
  for (const l of listeners()) {
    try {
      l(full);
    } catch {
      // ignore
    }
  }
}

export function subscribeJobEvents(listener: Listener): () => void {
  listeners().add(listener);
  return () => listeners().delete(listener);
}

export function getRecentJobEvents(): JobEvent[] {
  return [...recent()];
}
