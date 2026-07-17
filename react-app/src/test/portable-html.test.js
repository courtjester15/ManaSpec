import test from "node:test";
import assert from "node:assert/strict";
import { finalizePortableHtml } from "../../tools/portable-html.mjs";

test("portable classic script is deferred until the React root has been parsed", () => {
  const input = '<head><script type="module" crossorigin src="./assets/manaspec.js"></script></head><body><div id="root"></div></body>';
  const output = finalizePortableHtml(input);

  assert.match(output, /<script defer src="\.\/assets\/manaspec\.js"><\/script>/);
  assert.doesNotMatch(output, /type="module"|crossorigin/);
});

test("portable finalization is idempotent", () => {
  const input = '<script defer src="./assets/manaspec.js"></script>';
  assert.equal(finalizePortableHtml(finalizePortableHtml(input)), input);
});
