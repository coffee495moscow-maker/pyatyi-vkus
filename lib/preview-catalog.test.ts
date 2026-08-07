import assert from "node:assert/strict";
import test from "node:test";

import {
  previewCategories,
  previewProducts,
  shouldUsePreviewCatalog,
} from "./preview-catalog";

test("preview catalog exposes the full starter assortment", () => {
  assert.equal(previewCategories.length, 3);
  assert.equal(previewProducts.length, 8);
  assert.ok(previewProducts.every((product) => product.is_available));
  assert.ok(
    previewProducts.every((product) =>
      previewCategories.some((category) => category.id === product.category_id),
    ),
  );
});

test("preview catalog activates only when explicitly enabled", () => {
  assert.equal(shouldUsePreviewCatalog("true"), true);
  assert.equal(shouldUsePreviewCatalog("false"), false);
  assert.equal(shouldUsePreviewCatalog(undefined), false);
});
