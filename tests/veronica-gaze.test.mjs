import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";

const file = readFileSync(new URL("../src/components/home/workforce/VeronicaGaze.tsx", import.meta.url), "utf8");
const pure = file.slice(file.indexOf("const EYES"), file.indexOf("/** Static SSR"));
const warp = new Function(`${stripTypeScriptTypes(pure)}; return warpIris;`)();
const source = { data: new Uint8ClampedArray(64 * 64 * 4) };
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  source.data.set([x * 3, y * 3, 50, 255], (y * 64 + x) * 4);
}
const output = () => ({ data: new Uint8ClampedArray(48 * 48 * 4) });

test("neutral gaze preserves the original portrait pixels", () => {
  const result = output();
  warp(source, result, 0, 0);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    assert.deepEqual(result.data.slice((y * 48 + x) * 4, (y * 48 + x + 1) * 4), source.data.slice(((y + 8) * 64 + x + 8) * 4, ((y + 8) * 64 + x + 9) * 4));
  }
});

test("opposite gaze directions move the iris without changing surrounding face pixels", () => {
  const neutral = output(), left = output(), right = output();
  warp(source, neutral, 0, 0);
  warp(source, left, -5, -3);
  warp(source, right, 5, 3);
  const center = (24 * 48 + 24) * 4;
  assert.ok(left.data[center] > neutral.data[center]);
  assert.ok(right.data[center] < neutral.data[center]);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    const index = (y * 48 + x) * 4;
    assert.equal(right.data[index + 3], 255);
    if (Math.hypot(x - 24, y - 24) >= 24) {
      assert.deepEqual(right.data.slice(index, index + 4), neutral.data.slice(index, index + 4));
      assert.deepEqual(left.data.slice(index, index + 4), neutral.data.slice(index, index + 4));
    }
  }
});
