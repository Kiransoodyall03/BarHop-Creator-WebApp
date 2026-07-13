import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

const STORAGE_KEY = 'barhop-theme';
const THEME_COLORS = { dark: '#120B14', light: '#FFFBF7' };

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (e) {
    // localStorage unavailable (e.g. private browsing) — fall through
  }
  return 'dark'; // brand default
}

function subscribeToSystemTheme(callback) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSystemPrefersDark() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);
  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark
  );

  const resolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[resolvedTheme]);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // persistence is best-effort
    }
  }, [theme, resolvedTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
