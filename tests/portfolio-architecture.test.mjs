import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

test("portfolio route remains isolated from checkout and production data", async () => {
  const route = await readFile(new URL("src/routes/portfolio.tsx", ROOT), "utf8");
  const experience = await readFile(
    new URL("src/portfolio/components/PortfolioExperience.tsx", ROOT),
    "utf8",
  );
  const combined = `${route}\n${experience}`;

  assert.doesNotMatch(combined, /mercadopago|wallet-server|DATABASE_URL|RESEND_API_KEY/i);
  assert.match(route, /createFileRoute\("\/portfolio"\)/);
});

test("provider contracts are vendor-neutral", async () => {
  const providers = await readFile(new URL("src/portfolio/services/providers.ts", ROOT), "utf8");

  for (const contract of [
    "AIProvider",
    "ImageProvider",
    "VideoProvider",
    "VoiceProvider",
    "PaymentProvider",
  ]) {
    assert.match(providers, new RegExp(`interface ${contract}`));
  }
  assert.doesNotMatch(providers, /Vidu|Veo|Seedance|Mercado Pago/i);
});
