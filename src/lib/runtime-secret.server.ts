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
