import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// bun carrega .env.local sozinho em `bun run`, mas o CLI do drizzle-kit
// roda fora desse fluxo — carrega explícito aqui.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
