import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelScopedTransition,
  updateWithScopedTransition,
} from "../src/lib/scoped-view-transition.ts";

const tick = () => new Promise((resolve) => setImmediate(resolve));

test("an API that finishes without invoking the callback cannot drop the update", async () => {
  let calls = 0;
  const scope = {
    startViewTransition: () => ({
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      finished: Promise.resolve(),
      skipTransition() {},
    }),
  };
  updateWithScopedTransition(scope, () => calls++, false);
  await tick();
  assert.equal(calls, 1);
});

test("unsupported browsers and reduced-motion users receive the state update immediately", () => {
  let calls = 0;
  for (const scope of [
    null,
    {},
    { startViewTransition: () => assert.fail("animation started") },
  ]) {
    updateWithScopedTransition(scope, () => calls++, true);
  }
  updateWithScopedTransition({}, () => calls++, false);
  assert.equal(calls, 4);
});

test("throwing API and failed captures apply the update exactly once", async () => {
  let calls = 0;
  updateWithScopedTransition(
    {
      startViewTransition: () => {
        throw new Error("unsupported");
      },
    },
    () => calls++,
    false,
  );
  const scope = {
    startViewTransition: (callback) => {
      callback();
      return {
        ready: Promise.reject(new Error("capture failed")),
        updateCallbackDone: Promise.resolve(),
        finished: Promise.reject(new Error("skipped")),
        skipTransition() {},
      };
    },
  };
  updateWithScopedTransition(scope, () => calls++, false);
  await tick();
  assert.equal(calls, 2);
});

test("rapid filter changes cannot apply an older callback after a newer selection", async () => {
  const callbacks = [];
  let skips = 0;
  let selected;
  const scope = {
    startViewTransition: (callback) => {
      callbacks.push(callback);
      return {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        finished: new Promise(() => {}),
        skipTransition: () => skips++,
      };
    },
  };
  updateWithScopedTransition(
    scope,
    () => {
      selected = "image";
    },
    false,
  );
  updateWithScopedTransition(
    scope,
    () => {
      selected = "video";
    },
    false,
  );
  callbacks[1]();
  callbacks[0]();
  assert.equal(selected, "video");
  assert.equal(skips, 1);
  cancelScopedTransition(scope);
  await tick();
});

test("switching to reduced motion invalidates a pending animation callback", () => {
  let callback;
  let selected;
  const scope = {
    startViewTransition: (update) => {
      callback = update;
      return {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        finished: new Promise(() => {}),
        skipTransition() {},
      };
    },
  };
  updateWithScopedTransition(
    scope,
    () => {
      selected = "old";
    },
    false,
  );
  updateWithScopedTransition(
    scope,
    () => {
      selected = "latest";
    },
    true,
  );
  callback();
  assert.equal(selected, "latest");
});

test("unmount invalidates pending callbacks", () => {
  let callback;
  const scope = {
    startViewTransition: (update) => {
      callback = update;
      return {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        finished: new Promise(() => {}),
        skipTransition() {},
      };
    },
  };
  updateWithScopedTransition(
    scope,
    () => assert.fail("unmounted component updated"),
    false,
  );
  cancelScopedTransition(scope);
  callback();
});
