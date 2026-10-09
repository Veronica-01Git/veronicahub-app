type Bindings = Record<string, unknown>;

/** Prefer the deployed Worker's secrets, never a value captured during build. */
export async function getRuntimeSecret(
  name: string,
  loadBindings: () => Promise<Bindings | null> = async () => {
    try {
      // Native module exists in workerd, not in Vite's Node build process.
      const nativeModule = "cloudflare:workers";
      const { env } = await import(/* @vite-ignore */ nativeModule);
      return env;
    } catch {
      // Local Node development and tests do not provide this native module.
      return null;
    }
  },
): Promise<string | undefined> {
  const bindings = await loadBindings();
  const value = bindings === null ? process.env[name] : bindings[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** A deployed Worker binding object (R2 bucket, KV…); null outside workerd. */
export async function getRuntimeBinding<T = unknown>(name: string): Promise<T | null> {
  try {
    const nativeModule = "cloudflare:workers";
    const { env } = await import(/* @vite-ignore */ nativeModule);
    const value = (env as Record<string, unknown>)[name];
    return value && typeof value === "object" ? (value as T) : null;
  } catch {
    return null;
  }
}
