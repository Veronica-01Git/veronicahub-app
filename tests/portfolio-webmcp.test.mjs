import assert from "node:assert/strict";
import test from "node:test";
import {
  createPortfolioTools,
  registerPortfolioTools,
} from "../src/portfolio/features/webmcp/tools.ts";

const professions = ["Designer", "Desenvolvedor"];

test("WebMCP describes only public preview capabilities and never generates", async () => {
  const tools = createPortfolioTools(professions, () =>
    assert.fail("read-only tool mutated state"),
  );
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["veronica_portfolio_describe", "veronica_portfolio_prepare_brief"],
  );
  assert.equal(tools[0].annotations.readOnlyHint, true);
  const info = JSON.parse(await tools[0].execute({}));
  assert.equal(info.mode, "local_brief_preview");
  assert.equal(info.canGenerateViaTool, false);
  assert.equal(info.persistsData, false);
  assert.deepEqual(info.professions, professions);
});

test("brief preparation stages a suggestion and returns no personal fields", async () => {
  const suggestions = [];
  const tool = createPortfolioTools(professions, (brief) =>
    suggestions.push(brief),
  )[1];
  const result = JSON.parse(
    await tool.execute({ name: "  Matheus Amorim  ", profession: "Designer" }),
  );
  assert.deepEqual(suggestions, [
    { name: "Matheus Amorim", profession: "Designer" },
  ]);
  assert.deepEqual(result, {
    status: "awaiting_user_review",
    generated: false,
    saved: false,
  });
});

test("runtime validation rejects malformed data without staging a suggestion", async () => {
  const tool = createPortfolioTools(professions, () =>
    assert.fail("invalid input changed state"),
  )[1];
  for (const input of [
    null,
    [],
    "name",
    {},
    { name: " ", profession: "Designer" },
    { name: "A".repeat(81), profession: "Designer" },
    { name: "A\nB", profession: "Designer" },
    { name: "Matheus", profession: "invented" },
    { name: 42, profession: "Designer" },
    { name: "Matheus", profession: "Designer", publish: true },
  ]) {
    await assert.rejects(() => tool.execute(input));
  }
});

test("route disposal aborts registrations and blocks stale executions", async () => {
  const registered = [];
  const context = {
    registerTool: (tool, options) => registered.push({ tool, options }),
  };
  const dispose = registerPortfolioTools(
    context,
    createPortfolioTools(professions, () =>
      assert.fail("unmounted route changed state"),
    ),
  );
  assert.equal(registered.length, 2);
  assert.equal(registered[0].options.signal.aborted, false);
  dispose();
  assert.equal(registered[0].options.signal.aborted, true);
  await assert.rejects(
    () =>
      registered[1].tool.execute({ name: "Matheus", profession: "Designer" }),
    /fechada/,
  );
});

test("failed browser registrations leave no partial tools or uncaught rejection", async () => {
  let signal;
  const context = {
    registerTool: (_tool, options) => {
      signal = options.signal;
      return Promise.reject(new Error("trial unavailable"));
    },
  };
  registerPortfolioTools(
    context,
    createPortfolioTools(professions, () => {}),
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(signal.aborted, true);
  assert.doesNotThrow(() =>
    registerPortfolioTools(
      {
        registerTool: () => {
          throw new Error("policy denied");
        },
      },
      createPortfolioTools(professions, () => {}),
    ),
  );
});
