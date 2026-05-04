const memoryStore = new Map<string, string>();

export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const value = loadString(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  saveString(key, serialized);
}

export async function removeJson(key: string): Promise<void> {
  try {
    getWebStorage()?.removeItem(key);
  } catch {
    // Ignore storage failures and still clear fallbacks.
  }
  clearCookie(key);
  memoryStore.delete(key);
}

function loadString(key: string) {
  try {
    const localValue = getWebStorage()?.getItem(key);
    if (localValue) return localValue;
  } catch {
    // Fall through to cookie and memory.
  }

  return loadCookie(key) ?? memoryStore.get(key) ?? null;
}

function saveString(key: string, value: string) {
  let saved = false;

  try {
    const storage = getWebStorage();
    if (storage) {
      storage.setItem(key, value);
      saved = true;
    }
  } catch {
    saved = false;
  }

  if (!saved) {
    saveCookie(key, value);
  }

  memoryStore.set(key, value);
}

function getWebStorage() {
  try {
    if (
      typeof window !== "undefined" &&
      "localStorage" in window &&
      window.localStorage
    ) {
      return window.localStorage;
    }

    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function loadCookie(key: string) {
  try {
    if (typeof document === "undefined") return null;
    const prefix = `${encodeURIComponent(key)}=`;
    const entry = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    if (!entry) return null;
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

function saveCookie(key: string, value: string) {
  try {
    if (typeof document === "undefined") return;
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
      value
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Memory fallback remains available.
  }
}

function clearCookie(key: string) {
  try {
    if (typeof document === "undefined") return;
    document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Ignore.
  }
}
