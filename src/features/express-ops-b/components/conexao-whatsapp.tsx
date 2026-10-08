/**
 * Cartão "Conexão do WhatsApp" — só para a administradora do Hub.
 *
 * Mostra, em linguagem de checklist, se cada peça da ligação pelo provedor
 * está no lugar, e tem o botão que registra o webhook sem que ninguém precise
 * ver ou copiar a chave (ver data/conexao-whatsapp.ts). Para qualquer outra
 * pessoa o servidor responde `null` e o cartão não aparece.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  estadoConexaoWhatsApp,
  registrarWebhook360,
  type EstadoConexao,
} from "@/features/express-ops-b/data/conexao-whatsapp";
import { OpsCard, SectionTitle } from "@/features/express-ops-b/components/primitives";

function Item({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--ops-ink)]">
      {ok ? (
        <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ops-ok)]" />
      ) : (
        <CircleDashed aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ops-ink-muted)]" />
      )}
      <span className={cn(!ok && "text-[var(--ops-ink-soft)]")}>{children}</span>
    </li>
  );
}

export function ConexaoWhatsApp() {
  const [estado, setEstado] = useState<EstadoConexao | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      setEstado(await estadoConexaoWhatsApp());
    } catch {
      setEstado(null);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!estado) return null;

  const webhookOk = Boolean(estado.webhook?.urlCerta && estado.webhook.cabecalhoSecreto);
  const podeRegistrar = estado.provedor360 && estado.chave360 && estado.segredoWebhook;

  async function registrar() {
    setOcupado(true);
    setAviso(null);
    try {
      const r = await registrarWebhook360();
      setAviso(
        r.ok
          ? { tipo: "ok", texto: "Registrado. Conferindo de novo…" }
          : { tipo: "erro", texto: r.erro },
      );
      await carregar();
    } catch {
      setAviso({ tipo: "erro", texto: "Falha de conexão. Nada foi alterado." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <OpsCard as="section">
      <SectionTitle
        titulo="Conexão do WhatsApp · só administradora"
        apoio="Confere a ligação pelo provedor oficial. Nenhuma chave aparece aqui."
        acao={
          <Button type="button" size="sm" variant="outline" onClick={() => void carregar()}>
            <RefreshCw aria-hidden className="h-3.5 w-3.5" />
            Conferir
          </Button>
        }
      />
      <ul className="grid gap-1.5">
        <Item ok={estado.provedor360}>Provedor oficial ativado</Item>
        <Item ok={estado.segredoWebhook}>Segredo de recebimento guardado</Item>
        <Item ok={estado.chave360}>Chave do número guardada</Item>
        <Item ok={webhookOk}>
          Recebimento de mensagens registrado no provedor
          {estado.avisoWebhook ? ` — ${estado.avisoWebhook}` : ""}
        </Item>
        <Item ok={!estado.envioLiberado}>
          {estado.envioLiberado
            ? "Envio LIBERADO: a agente responde clientes"
            : "Modo observação: a agente só sugere, não envia"}
        </Item>
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!podeRegistrar || ocupado}
          onClick={() => void registrar()}
        >
          <Link2 aria-hidden className="h-4 w-4" />
          {ocupado ? "Registrando…" : webhookOk ? "Registrar de novo" : "Registrar recebimento"}
        </Button>
        {!podeRegistrar ? (
          <span className="text-[12px] text-[var(--ops-ink-muted)]">
            Disponível quando os três primeiros itens estiverem marcados.
          </span>
        ) : null}
      </div>

      {aviso ? (
        <p
          role={aviso.tipo === "erro" ? "alert" : "status"}
          className={cn(
            "mt-2 text-[13px]",
            aviso.tipo === "erro" ? "text-[var(--ops-danger)]" : "text-[var(--ops-ok)]",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}
    </OpsCard>
  );
}
