const BASE_URL = "https://platform.higgsfield.ai";

type V2RequestStatus = "queued" | "in_progress" | "completed" | "failed" | "nsfw";
type CreateJobSetResponse = {
  id: string;
  jobs: { id: string; status: V2RequestStatus }[];
};
type V2StatusResponse = {
  status: V2RequestStatus;
  request_id: string;
  images?: { url: string }[];
};

// Só a Nano Banana Pro (text2image/soul) está integrada de verdade — é a
// única provada de ponta a ponta (ver histórico do higgsfield-test.ts).
// Vídeo (Seedance/Veo/Kling/Sora), Midjourney, FLUX, voz e avatar continuam
// simulados no cliente até serem integrados um a um.
//
// fetch cru em vez do SDK @higgsfield/client: o pacote (v0.2.1) monta o
// body sem o wrapper `params` que a API exige, causando 422 em todo
// request. Confirmado direto contra a API real.
//
// quality: "4k" — pedido explícito do usuário (a API só tinha sido testada
// com "1080p" até aqui). "4k" é o mesmo nome de tier já usado pros vídeos
// Higgsfield deste projeto (ver PRECOS-STUDIO.md), mas NÃO foi confirmado
// contra a API real de imagem ainda — se `generateNanoBananaImage` passar a
// retornar erro em produção, o primeiro suspeito é este valor.
export async function generateNanoBananaImage(params: {
  prompt: string;
}): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string; reason?: "nsfw" }> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials) {
    return { ok: false, error: "HF_CREDENTIALS não configurada." };
  }

  const headers = {
    Authorization: `Key ${credentials}`,
    "Content-Type": "application/json",
  };

  try {
    const createRes = await fetch(`${BASE_URL}/v1/text2image/soul`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        params: {
          prompt: params.prompt,
          width_and_height: "1536x1536",
          quality: "4k",
          batch_size: 1,
        },
      }),
    });

    if (createRes.status === 403) {
      return { ok: false, error: "Créditos insuficientes na conta de developer da Higgsfield." };
    }
    if (!createRes.ok) {
      const detail = await createRes.text();
      return { ok: false, error: `Erro ${createRes.status} ao criar job: ${detail}` };
    }

    const created = (await createRes.json()) as CreateJobSetResponse;
    let job: V2StatusResponse = {
      status: created.jobs[0]?.status ?? "queued",
      request_id: created.id,
    };

    const startTime = Date.now();
    const maxPollTimeMs = 180_000;
    while (job.status !== "completed" && job.status !== "failed" && job.status !== "nsfw") {
      if (Date.now() - startTime > maxPollTimeMs) {
        return { ok: false, error: `Job não completou a tempo. Status: ${job.status}` };
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const pollRes = await fetch(`${BASE_URL}/requests/${job.request_id}/status`, { headers });
      if (!pollRes.ok) {
        const detail = await pollRes.text();
        return { ok: false, error: `Erro ${pollRes.status} ao consultar status: ${detail}` };
      }
      job = (await pollRes.json()) as V2StatusResponse;
    }

    if (job.status === "nsfw") {
      return {
        ok: false,
        error: "prompt bloqueado pela checagem de segurança da Higgsfield — você não foi cobrado.",
        reason: "nsfw",
      };
    }
    if (job.status !== "completed") {
      return { ok: false, error: `Job terminou com status: ${job.status}` };
    }

    const imageUrl = job.images?.[0]?.url;
    if (!imageUrl) {
      return { ok: false, error: "Job completou mas não retornou URL de imagem." };
    }

    return { ok: true, imageUrl };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Erro desconhecido ao chamar a API do Higgsfield.",
    };
  }
}
