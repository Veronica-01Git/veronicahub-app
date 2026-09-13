import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { PRODUCTS, CATEGORIES, INTENTS, INTENT_LINKS, PRIMARY_NAV, HOME_PRODUCTS } from '../src/lib/ecosystem.ts';
import { sealRecords } from '../src/lib/seals.ts';
import { BEAT_VALUES } from '../src/lib/beats.ts';
import { WIRE_OFFERS } from '../src/lib/wire-commerce.ts';
import { WIRE_INSTAGRAM_HANDLE, wrapHeadline } from '../src/lib/wire-instagram-card.ts';

// Resolve somente os descritores locais de imagem do catálogo, sem rede.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/assets/') && specifier.endsWith('.json')) {
      return { url: new URL('../src/' + specifier.slice(2), import.meta.url).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.asset.json')) {
      return { format: 'module', source: `export default ${readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
    }
    return next(url, context);
  },
});
const { courses } = await import('../src/lib/courses.ts');
const routeDir = new URL('../src/routes/', import.meta.url);
const routeSources = readdirSync(routeDir, { recursive: true }).filter(name => /\.tsx?$/.test(name)).map(name => readFileSync(new URL(name, routeDir), 'utf8')).join('\n');
const routes = new Set([...routeSources.matchAll(/createFileRoute\(["']([^"']+)["']\)/g)].map(match => match[1].replace(/\/$/, "") || "/"));

test('cada destino interno do ecossistema corresponde a uma rota existente', () => {
  for (const item of PRODUCTS.filter(item => !item.external)) assert.ok(routes.has(item.to), `${item.id}: ${item.to}`);
});
test('identidades são únicas e categorias são válidas', () => {
  assert.equal(new Set(PRODUCTS.map(item => item.id)).size, PRODUCTS.length);
  for (const item of PRODUCTS) assert.ok(CATEGORIES.includes(item.category));
});
test('navegação pública não inclui administração nem destinos vazios', () => {
  for (const item of [...PRIMARY_NAV, ...HOME_PRODUCTS, ...INTENT_LINKS]) {
    assert.ok(item.to && item.to !== '#');
    assert.ok(!item.to.startsWith('/admin'));
  }
  assert.deepEqual(PRIMARY_NAV.map(item => item.to), ['/comandos', '/prompt-packs', '/blog']);
});
test('as seis intenções apontam para produtos públicos existentes', () => {
  assert.deepEqual(INTENTS.map(item => item.label), ['Aprender', 'Criar', 'Vender', 'Proteger', 'Trabalhar', 'Me atualizar']);
  for (const intent of INTENTS) assert.ok(PRODUCTS.some(item => item.id === intent.productId && item.public));
});
test('formações têm identificador e disponibilidade; acesso exige destino real', () => {
  assert.equal(courses.length, 11);
  assert.equal(new Set(courses.map(course => course.slug)).size, courses.length);
  for (const course of courses) {
    assert.match(course.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(course.futurePath, `/formacoes/${course.slug}`);
    assert.ok(course.cta && course.description && course.outcome && course.availability);
    assert.ok(course.level && course.duration);
    assert.notEqual(course.href, '/');
    if (course.status === 'available') assert.ok(course.href && routes.has(course.href));
    else { assert.equal(course.href, undefined); assert.match(course.availability, /produção|breve/i); }
  }
});

test('selos têm série única e demonstrações não se apresentam como clientes reais', () => {
  assert.equal(new Set(sealRecords.map(record => record.serial)).size, sealRecords.length);
  assert.ok(sealRecords.some(record => record.client === 'Express Entulho' && !record.isDemonstration));
  for (const record of sealRecords) {
    assert.match(record.serial, /^VH-[A-Z0-9-]+$/);
    assert.ok(record.client && record.solution && record.scope.length > 0 && record.timeline.length > 0);
    if (record.status === 'concept') {
      assert.equal(record.isDemonstration, true);
      assert.match(record.serial, /-DEMO-/);
    }
  }
});

test('cada editoria do Wire possui uma oferta própria mensurável e interna', () => {
  assert.deepEqual(Object.keys(WIRE_OFFERS).sort(), [...BEAT_VALUES].sort());
  assert.equal(new Set(Object.values(WIRE_OFFERS).map(offer => offer.id)).size, BEAT_VALUES.length);
  for (const offer of Object.values(WIRE_OFFERS)) {
    assert.match(offer.id, /^[a-z0-9-]+$/);
    assert.ok(offer.path.startsWith('/') && !offer.path.startsWith('//'));
    assert.ok(routes.has(offer.path), `${offer.id}: ${offer.path}`);
    assert.ok(offer.title && offer.description && offer.cta && offer.eyebrow);
  }
});

test('Wire expõe governança editorial e painel de desempenho em rotas reais', () => {
  assert.ok(routes.has('/blog/expediente'));
  assert.ok(routes.has('/admin/wire'));
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /news-sitemap\.xml/);
});

test('o card do Instagram e o link do perfil apontam pro mesmo @ da Wire TV', () => {
  const chrome = readFileSync(new URL('../src/components/SiteChrome.tsx', import.meta.url), 'utf8');
  const link = chrome.match(/wireInstagram:\s*"([^"]+)"/);
  assert.ok(link, 'SOCIAL_LINKS.wireInstagram precisa existir');
  // O @ impresso no card e o perfil linkado no site saem do mesmo lugar:
  // se um mudar sem o outro, o card manda o leitor pra um perfil que não é o
  // do link — o tipo de divergência que só aparece depois de publicado.
  assert.equal(WIRE_INSTAGRAM_HANDLE, '@' + new URL(link[1]).pathname.replace(/\//g, ''));
  assert.match(routeSources, /<ArticleShare/);
});

test('a manchete do card cabe no limite de linhas e sinaliza o corte', () => {
  const context = { measureText: text => ({ width: text.length * 20 }) };
  const curta = wrapHeadline(context, 'Nvidia negocia investimento bilionário', 400, 5);
  assert.ok(curta.length <= 5);
  assert.equal(curta.join(' '), 'Nvidia negocia investimento bilionário');
  assert.ok(!curta.at(-1).endsWith('…'));

  const longa = wrapHeadline(context, 'palavra '.repeat(60).trim(), 400, 5);
  assert.equal(longa.length, 5);
  assert.match(longa.at(-1), /…$/);
  for (const linha of longa) assert.ok(context.measureText(linha).width <= 400, linha);
});

test('o Worker de cron dispara um workflow que existe de verdade', () => {
  const worker = readFileSync(new URL('../workers/wire-cron/src/index.ts', import.meta.url), 'utf8');
  const config = readFileSync(new URL('../workers/wire-cron/wrangler.jsonc', import.meta.url), 'utf8');

  // O Worker chama o workflow pelo nome do arquivo: se ele for renomeado no
  // .github/workflows, o disparo passa a devolver 404 em silêncio — a falha
  // apareceria só como ausência de matéria nova.
  const workflow = worker.match(/const WORKFLOW = "([^"]+)"/);
  assert.ok(workflow, 'o Worker precisa declarar WORKFLOW');
  const workflows = readdirSync(new URL('../.github/workflows/', import.meta.url));
  assert.ok(workflows.includes(workflow[1]), `${workflow[1]} não existe em .github/workflows`);

  // O deploy pelo painel do Cloudflare usa dashboard.js, não o .ts: se os dois
  // divergirem, o que roda em produção deixa de ser o que está versionado.
  const dashboard = readFileSync(new URL('../workers/wire-cron/dashboard.js', import.meta.url), 'utf8');
  for (const name of ['OWNER', 'REPO', 'WORKFLOW', 'REF']) {
    const pattern = new RegExp(`const ${name} = "([^"]+)"`);
    assert.equal(dashboard.match(pattern)?.[1], worker.match(pattern)?.[1], name);
  }

  const crons = JSON.parse(config.replace(/^\s*\/\/.*$/gm, '')).triggers.crons;
  assert.ok(Array.isArray(crons) && crons.length > 0, 'wrangler.jsonc precisa declarar crons');
  for (const cron of crons) assert.equal(cron.trim().split(/\s+/).length, 5, cron);
});

test('o diagnóstico do radar não desclassifica um pulo editorial', () => {
  const cron = readFileSync(new URL('../src/lib/article-cron.ts', import.meta.url), 'utf8');
  const server = readFileSync(new URL('../src/lib/articles-server.ts', import.meta.url), 'utf8');

  // isEditorialSkip decide, por PREFIXO, se a rodada foi um pulo editorial
  // (HTTP 200, workflow verde) ou uma falha real (502, workflow vermelho).
  const block = cron.match(/function isEditorialSkip[\s\S]*?\[([\s\S]*?)\]\.some/);
  assert.ok(block, 'isEditorialSkip precisa listar os prefixos');
  const prefixes = [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => match[1]);
  assert.ok(
    prefixes.includes('sem fato verificável no momento'),
    'a desistência do modelo precisa continuar na lista de pulos editoriais',
  );

  // articles-server carimba a contagem do radar nessa mesma mensagem. Se o
  // carimbo for para a FRENTE, o prefixo deixa de casar e toda hora sem fato
  // passa a pintar o workflow de vermelho.
  const message = server.match(/error: `([^`]*radar:[^`]*)`/);
  assert.ok(message, 'a mensagem editorial precisa carregar o diagnóstico do radar');
  assert.ok(
    message[1].startsWith('${parsed.error}'),
    `o diagnóstico tem que vir depois da mensagem do modelo, e veio: ${message[1]}`,
  );
});

test('capa que a biblioteca já serve não passa por download', () => {
  const cron = readFileSync(new URL('../src/lib/article-cron.ts', import.meta.url), 'utf8');
  const save = cron.slice(cron.indexOf('async function saveCoverToMediaLibrary'));
  const body = save.slice(0, save.indexOf('\n}\n'));

  // /api/media-images/<id> é servido pela própria aplicação a partir de
  // mediaImages. Buscar essa URL é o Worker chamando o próprio domínio, que o
  // Cloudflare encerra com 522 — foi o que derrubou três dos sete slugs do
  // backfill. A checagem só evita isso se vier ANTES do fetch.
  const guard = body.indexOf('mediaLibraryImageId(');
  const download = body.indexOf('await fetch(');
  assert.ok(guard !== -1, 'saveCoverToMediaLibrary precisa reconhecer capa já hospedada na biblioteca');
  assert.ok(download !== -1, 'saveCoverToMediaLibrary precisa continuar baixando as demais capas');
  assert.ok(guard < download, 'a checagem da biblioteca tem que vir antes do download, senão o 522 volta');

  // O desvio para o GitHub cobre /images/; a biblioteca é banco, não arquivo.
  assert.ok(
    /url\.pathname\.startsWith\("\/api\/media-images\/"\)/.test(cron),
    'o reconhecimento precisa casar o caminho real da biblioteca',
  );
});
