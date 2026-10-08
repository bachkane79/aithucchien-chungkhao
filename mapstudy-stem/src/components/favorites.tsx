'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const key = 'mapstudy-stem:favorites';
const FavoritesContext = createContext<{ favorites: string[]; toggle: (slug: string) => void; ready: boolean }>({ favorites: [], toggle: () => {}, ready: false });

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      if (Array.isArray(stored)) setFavorites(stored.filter((item): item is string => typeof item === 'string'));
    } catch { /* Trình duyệt vẫn sử dụng được nếu bộ nhớ không khả dụng. */ }
    setReady(true);
  }, []);
  const toggle = (slug: string) => setFavorites((current) => {
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Giữ trạng thái trong phiên hiện tại. */ }
    return next;
  });
  return <FavoritesContext.Provider value={{ favorites, toggle, ready }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() { return useContext(FavoritesContext); }
