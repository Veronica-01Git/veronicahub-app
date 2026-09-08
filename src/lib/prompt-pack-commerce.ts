/**
 * Public, provider-neutral checkout configuration.
 *
 * Point this variable to a hosted checkout when a provider is selected.
 * No provider credentials or secrets belong in VITE_* variables.
 */
const VOICE_PACK_CHECKOUT_URL = import.meta.env.VITE_PROMPT_PACK_VOICE_CHECKOUT_URL?.trim();

export function getVoicePackCheckoutUrl(): string | null {
  if (!VOICE_PACK_CHECKOUT_URL) return null;

  try {
    const url = new URL(VOICE_PACK_CHECKOUT_URL);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
