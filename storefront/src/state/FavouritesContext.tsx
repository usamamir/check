import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type FavouritesContextValue = {
  ids: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);
const STORAGE_KEY = "jettribe-favs-v1";

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const value = useMemo(
    () => ({
      ids,
      has: (slug: string) => ids.includes(slug),
      toggle: (slug: string) =>
        setIds((prev) =>
          prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
        ),
    }),
    [ids],
  );

  return (
    <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
