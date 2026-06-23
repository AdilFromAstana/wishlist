"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, WishlistItem } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface DataContextValue {
  profiles: Profile[];
  items: WishlistItem[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  upsertItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
}

const DataContext = createContext<DataContextValue>({
  profiles: [],
  items: [],
  loading: true,
  error: "",
  refresh: async () => {},
  upsertItem: () => {},
  removeItem: () => {},
});

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const [i, p] = await Promise.all([
      supabase.from("wishlist_items").select("*"),
      supabase.from("profiles").select("*"),
    ]);
    if (i.error) setError(i.error.message);
    else setItems((i.data as WishlistItem[]) ?? []);
    if (p.data) setProfiles(p.data as Profile[]);
    setLoading(false);
    setLoaded(true);
  }, []);

  // Грузим один раз после входа; чистим кэш при выходе.
  useEffect(() => {
    if (session && !loaded) {
      refresh();
    } else if (!session) {
      setProfiles([]);
      setItems([]);
      setLoaded(false);
      setLoading(true);
    }
  }, [session, loaded, refresh]);

  const upsertItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx === -1) return [item, ...prev];
      const copy = [...prev];
      copy[idx] = item;
      return copy;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <DataContext.Provider
      value={{ profiles, items, loading, error, refresh, upsertItem, removeItem }}
    >
      {children}
    </DataContext.Provider>
  );
}
