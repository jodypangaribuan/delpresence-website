// Next.js instrumentation hook - runs before the app starts on the server.
// Fixes Node.js 25+ where localStorage exists as a broken global object
// (no getItem/setItem) when --localstorage-file is passed without a valid path.

export function register() {
    if (typeof window === 'undefined' && typeof globalThis.localStorage !== 'undefined') {
        if (typeof globalThis.localStorage.getItem !== 'function') {
            const store = new Map<string, string>();
            globalThis.localStorage = {
                getItem(key: string) { return store.get(key) ?? null; },
                setItem(key: string, value: string) { store.set(key, String(value)); },
                removeItem(key: string) { store.delete(key); },
                clear() { store.clear(); },
                get length() { return store.size; },
                key(index: number) { return Array.from(store.keys())[index] ?? null; },
            } as Storage;
        }
    }
}
