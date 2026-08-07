import assert from "node:assert/strict";
import test from "node:test";

import { safeLocalRedirect } from "./security";

test("safeLocalRedirect accepts only single-slash local paths", () => {
  assert.equal(safeLocalRedirect("/profile"), "/profile");
  assert.equal(safeLocalRedirect("/checkout?coupon=1"), "/checkout?coupon=1");
  assert.equal(safeLocalRedirect("https://evil.example"), "/");
  assert.equal(safeLocalRedirect("//evil.example"), "/");
  assert.equal(safeLocalRedirect("\\evil.example"), "/");
  assert.equal(safeLocalRedirect(""), "/");
});
