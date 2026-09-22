import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PackagePlus,
  Power,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  importAffiliateProductsAdmin,
  listAffiliateProductsAdmin,
  saveAffiliateProductAdmin,
  setAffiliateProductStatusAdmin,
} from "@/lib/affiliate-catalog-server";
import { AFFILIATE_CATEGORIES } from "@/lib/affiliate-products";

export const Route = createFileRoute("/admin/produtos-shopee" as any)({
  component: ShopeeProductsAdmin,
  head: () => ({
    meta: [{ title: "Produtos Shopee · Painel Admin | Veronica Hub" }],
  }),
});

type ProductRow = {
  id: string;
  name: string;
  category: string;
  affiliateUrl: string;
  priceLabel: string;
  commissionLabel?: string;
  angle: string;
  active: boolean;
  priority: number;
  clicks30d: number;
  updatedAt: string;
};

const emptyForm = {
  id: "",
  name: "",
  category: "eletronicos",
  affiliateUrl: "",
  priceLabel: "",
  commissionLabel: "",
  angle: "",
  priority: "0",
};

function ShopeeProductsAdmin() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bulk, setBulk] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    listAffiliateProductsAdmin()
      .then((result) => {
        if (!result.ok) {
          setAuthorized(false);
          setNotice(result.error);
          return;
        }
        setAuthorized(true);
        setProducts(result.products as ProductRow[]);
      })
      .catch((error) => {
        setAuthorized(false);
        setNotice(error instanceof Error ? error.message : "Falha ao carregar catálogo.");
      });
  }

  useEffect(refresh, []);

  function edit(product: ProductRow) {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      affiliateUrl: product.affiliateUrl,
      priceLabel: product.priceLabel,
      commissionLabel: product.commissionLabel ?? "",
      angle: product.angle,
      priority: String(product.priority),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const result = await saveAffiliateProductAdmin({
        data: { ...form, priority: Number(form.priority) || 0 },
      });
      if (!result.ok) setNotice(result.error);
      else {
        setNotice("Produto validado e publicado no radar.");
        setForm(emptyForm);
        refresh();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao salvar produto.");
    } finally {
      setBusy(false);
    }
  }

  async function importBatch() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await importAffiliateProductsAdmin({ data: { raw: bulk } });
      if (!result.ok) {
        setNotice(`${result.imported} importados. ${(result.errors ?? []).join(" | ")}`);
      } else {
        setNotice(`${result.imported} produtos importados e publicados.`);
        setBulk("");
      }
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha na importação.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(product: ProductRow) {
    const result = await setAffiliateProductStatusAdmin({
      data: { id: product.id, active: !product.active },
    });
    if (!result.ok) setNotice(result.error);
    else refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#171719]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Painel admin
            </Link>
            <p className="mt-7 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-emerald-700">
              Shopee Catalog Manager
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              Produtos que entram no radar.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#68686d]">
              Cadastre apenas links completos gerados no painel de afiliados da Shopee. Ao salvar,
              o produto aparece na Veronica Analytics sem precisar de novo deploy.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-sm">
            <p className="font-mono-tech text-[9px] uppercase tracking-widest text-[#8a8a90]">
              Catálogo
            </p>
            <p className="mt-1 text-2xl font-semibold">{products.filter((p) => p.active).length}</p>
            <p className="text-xs text-[#77777c]">produtos ativos</p>
          </div>
        </div>

        {authorized === false ? (
          <div className="mt-10 flex gap-3 rounded-2xl border border-red-200 bg-white p-5">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium">{notice ?? "Acesso restrito."}</p>
              <p className="mt-1 text-sm text-[#68686d]">
                Entre com a conta administrativa e recarregue a página.
              </p>
            </div>
          </div>
        ) : (
          <>
            {notice && (
              <div className="mt-8 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {notice}
              </div>
            )}

            <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
              <form onSubmit={save} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <PackagePlus className="h-5 w-5" />
                  <h2 className="font-display text-2xl">
                    {form.id ? "Editar produto" : "Adicionar produto"}
                  </h2>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-xs font-medium">
                    Nome
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-emerald-600" />
                  </label>
                  <label className="text-xs font-medium">
                    Categoria
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm">
                      {AFFILIATE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    Prioridade
                    <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm" />
                  </label>
                  <label className="text-xs font-medium">
                    Preço exibido
                    <input required placeholder="a partir de R$ 79,90" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm" />
                  </label>
                  <label className="text-xs font-medium">
                    Comissão informada (opcional)
                    <input placeholder="ex.: até 12%" value={form.commissionLabel} onChange={(e) => setForm({ ...form, commissionLabel: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm" />
                  </label>
                  <label className="sm:col-span-2 text-xs font-medium">
                    Ângulo de venda
                    <textarea required rows={3} value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm leading-6" />
                  </label>
                  <label className="sm:col-span-2 text-xs font-medium">
                    Link completo de afiliado Shopee
                    <textarea required rows={4} value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 font-mono text-xs leading-5" />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Validar e publicar
                  </button>
                  {form.id && <button type="button" onClick={() => setForm(emptyForm)} className="rounded-full border border-black/10 px-5 py-3 text-xs font-semibold">Cancelar edição</button>}
                </div>
              </form>

              <div className="rounded-3xl border border-black/10 bg-[#121315] p-6 text-white shadow-sm">
                <Upload className="h-5 w-5 text-emerald-300" />
                <h2 className="mt-4 font-display text-2xl">Importação em lote</h2>
                <p className="mt-2 text-xs leading-6 text-white/55">
                  Cole um array JSON com até 50 produtos ou linhas copiadas de uma planilha,
                  separadas por TAB: nome, categoria, preço, comissão, ângulo, link e prioridade.
                </p>
                <textarea
                  rows={13}
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                  placeholder={'[{"name":"Produto","category":"casa","priceLabel":"R$ 49,90","commissionLabel":"","angle":"Problema que resolve","affiliateUrl":"https://shopee.com.br/...","priority":10}]'}
                  className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-mono text-[11px] leading-5 text-white outline-none focus:border-emerald-300"
                />
                <button type="button" disabled={busy || !bulk.trim()} onClick={importBatch} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-xs font-semibold text-black disabled:opacity-40">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Importar lote
                </button>
              </div>
            </section>

            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-emerald-700">Inventário</p>
                  <h2 className="mt-2 font-display text-3xl">Catálogo cadastrado</h2>
                </div>
                <p className="text-xs text-[#77777c]">Cliques dos últimos 30 dias</p>
              </div>
              <div className="mt-5 grid gap-4">
                {products.map((product) => (
                  <article key={product.id} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-[#77777c]">
                        <span>{product.category}</span>
                        <span>·</span>
                        <span className={product.active ? "text-emerald-700" : "text-red-600"}>{product.active ? "ativo" : "arquivado"}</span>
                        <span>· prioridade {product.priority}</span>
                      </div>
                      <h3 className="mt-2 font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-[#68686d]">{product.priceLabel} · {product.clicks30d} cliques</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Conferir</a>
                      <button type="button" onClick={() => edit(product)} className="rounded-full border border-black/10 px-3 py-2 text-xs">Editar</button>
                      <button type="button" onClick={() => toggle(product)} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs"><Power className="h-3.5 w-3.5" /> {product.active ? "Arquivar" : "Ativar"}</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
