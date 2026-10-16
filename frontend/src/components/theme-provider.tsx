import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const PRIMARY_KEY = "theme";
const LEGACY_KEY = "hackathon-os-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = (localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY)) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {}
  return "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function updateMetaThemeColor(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const meta = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
  const color = resolved === "dark" ? "#0E0E10" : "#F5F5F5";
  if (meta) {
    meta.setAttribute("content", color);
  }
}

function applyThemeDom(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  updateMetaThemeColor(resolved);
}

/**
 * Theme provider for light/dark/system mode.
 * Persists to localStorage ("theme") and syncs between tabs.
 * Applies data-theme and .dark on <html>, with 150ms transition on theme switch.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = getStoredTheme();
    return initial ?? defaultTheme;
  });

  const isInitialMount = useRef(true);
  const transitionTimer = useRef<number | null>(null);

  const resolvedTheme = resolveTheme(theme);

  const triggerThemeTransition = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const reducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-motion") === "on" ||
      document.documentElement.getAttribute("data-motion") === "reduced";

    if (reducedMotion) return;

    const root = document.documentElement;
    root.classList.add("theme-transition");
    if (transitionTimer.current) {
      window.clearTimeout(transitionTimer.current);
    }
    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      transitionTimer.current = null;
    }, 160);
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme === theme) return;
      triggerThemeTransition();
      setThemeState(newTheme);
      try {
        localStorage.setItem(PRIMARY_KEY, newTheme);
        localStorage.setItem(LEGACY_KEY, newTheme);
      } catch {}
    },
    [theme, triggerThemeTransition]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  // Apply theme to DOM
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      applyThemeDom(resolvedTheme);
    } else {
      applyThemeDom(resolvedTheme);
    }
  }, [resolvedTheme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyThemeDom(resolveTheme("system"));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Sync theme changes across tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PRIMARY_KEY || e.key === LEGACY_KEY) {
        const next = getStoredTheme();
        setThemeState((prev) => (prev !== next ? next : prev));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

