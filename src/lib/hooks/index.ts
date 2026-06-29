import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Generic fetch hook
export function useFetch<T>(url: string | null, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [url]); // eslint-disable-line

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, isLoading, error, refetch: fetch_ };
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => { setIsOnline(false); toast.warning('You are offline'); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return isOnline;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [value, set] as const;
}

// Clipboard hook
export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed');
    }
  }, [timeout]);
  return { copied, copy };
}

// PWA install prompt
export function usePWAInstall() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    (prompt as { prompt: () => Promise<void> }).prompt();
    setPrompt(null);
  };

  return { canInstall: !!prompt, isInstalled, install };
}
