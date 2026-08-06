import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Driver HTTP do Neon — sem WebSocket/socket TCP, roda em Cloudflare
// Workers. Sem transação interativa multi-round-trip; só single-query e
// `db.batch([...])`, o que basta pro débito condicional atômico da
// carteira (ver wallet-server.ts). Trocamos Prisma por Drizzle aqui porque
// o engine WASM do Prisma não instancia corretamente no build real de
// Workers (confirmado em teste: "WebAssembly.Instance(): Argument 0 must
// be a WebAssembly.Module") — Drizzle não depende de engine WASM.
let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não configurada");
    }
    const sql = neon(connectionString);
    client = drizzle(sql, { schema });
  }
  return client;
}
