import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  SHORTS_ENGINE: DurableObjectNamespace<ShortsEngine>;
  HUB_BASE_URL: string;
  SOCIAL_RENDER_SECRET: string;
  SHORTS_S3_ENDPOINT: string;
  SHORTS_S3_ACCESS_KEY_ID: string;
  SHORTS_S3_SECRET_ACCESS_KEY: string;
  SHORTS_S3_BUCKET: string;
  SHORTS_S3_PREFIX: string;
  WHISPER_MODEL: string;
}

// The cron ticks every 5 minutes while there is work; 15 minutes of silence
// means the queue is empty and the instance can sleep (billing stops).
export class ShortsEngine extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "15m";
  entrypoint = ["python", "runner.py"];

  constructor(ctx: DurableObjectState<Record<string, never>>, env: Env) {
    super(ctx, env);
    this.envVars = {
      HUB_BASE_URL: env.HUB_BASE_URL,
      SOCIAL_RENDER_SECRET: env.SOCIAL_RENDER_SECRET,
      SHORTS_S3_ENDPOINT: env.SHORTS_S3_ENDPOINT,
      SHORTS_S3_ACCESS_KEY_ID: env.SHORTS_S3_ACCESS_KEY_ID,
      SHORTS_S3_SECRET_ACCESS_KEY: env.SHORTS_S3_SECRET_ACCESS_KEY,
      SHORTS_S3_BUCKET: env.SHORTS_S3_BUCKET,
      SHORTS_S3_PREFIX: env.SHORTS_S3_PREFIX,
      WHISPER_MODEL: env.WHISPER_MODEL,
    };
  }
}

async function pending(env: Env) {
  const response = await fetch(`${env.HUB_BASE_URL}/api/social/render/pending`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.SOCIAL_RENDER_SECRET}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) throw new Error(`HUB_PENDING_${response.status}`);
  const data = (await response.json()) as { ok?: boolean; queued?: number; running?: number };
  if (!data.ok) throw new Error("HUB_PENDING_REJECTED");
  return { queued: Number(data.queued ?? 0), running: Number(data.running ?? 0) };
}

async function tick(env: Env) {
  const { queued, running } = await pending(env);
  // No queued or running job: never start paid compute.
  if (!queued && !running) {
    console.log(JSON.stringify({ event: "idle" }));
    return;
  }
  // Starts the instance if asleep, renews its activity timer if awake, and
  // makes the engine claim jobs until the queue is empty.
  const engine = getContainer(env.SHORTS_ENGINE, "primary");
  const response = await engine.fetch(new Request("http://engine/tick", { method: "POST" }));
  const state = await response.json();
  console.log(JSON.stringify({ event: "tick", queued, running, state }));
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(tick(env));
  },
  async fetch() {
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
