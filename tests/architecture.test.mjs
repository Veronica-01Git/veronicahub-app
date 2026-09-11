import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { PRODUCTS, CATEGORIES, INTENTS, INTENT_LINKS, PRIMARY_NAV, HOME_PRODUCTS } from '../src/lib/ecosystem.ts';

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
