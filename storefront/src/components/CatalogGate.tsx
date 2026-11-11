import { useEffect, useState, type ReactNode } from "react";
import { loadCatalog } from "@/data/products";

export function CatalogGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h1>Could not load catalog</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#707072" }}>
        Loading Jettribe…
      </div>
    );
  }

  return <>{children}</>;
}
