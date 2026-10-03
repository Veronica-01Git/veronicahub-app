import test from "node:test";
import assert from "node:assert/strict";
import {
  analyticsStartDate,
  fillAnalyticsDays,
  validateAnalyticsPeriod,
  analyticsSourceLabel,
} from "../src/lib/affiliate-analytics.ts";

test("analytics only accepts bounded numeric periods", () => {
  for (const days of [7, 30, 90]) assert.deepEqual(validateAnalyticsPeriod({ days }), { days });
  for (const days of [0, -1, 365, "30", null])
    assert.throws(() => validateAnalyticsPeriod({ days }));
});

test("calendar window includes today once across month boundaries", () => {
  const now = new Date("2026-03-03T22:30:00Z");
  assert.equal(analyticsStartDate(7, now).toISOString(), "2026-02-25T00:00:00.000Z");
  const days = fillAnalyticsDays(
    7,
    [
      { date: "2026-02-28", clicks: 8 },
      { date: "2026-03-03", clicks: 2 },
    ],
    now,
  );
  assert.equal(days.length, 7);
  assert.equal(days[0].clicks, 0);
  assert.equal(days[3].clicks, 8);
  assert.deepEqual(days.at(-1), { date: "2026-03-03", clicks: 2 });
  assert.equal(
    days.reduce((sum, day) => sum + day.clicks, 0),
    10,
  );
});

test("known and historical source names remain readable", () => {
  assert.equal(analyticsSourceLabel("analytics_instagram"), "Instagram");
  assert.equal(analyticsSourceLabel("link_divulgador"), "Geral");
  assert.equal(analyticsSourceLabel("analytics_catalogo"), "Catálogo");
  assert.equal(analyticsSourceLabel("unrecognized"), "Outras origens");
});
