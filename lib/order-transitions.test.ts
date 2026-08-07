import assert from "node:assert/strict";
import test from "node:test";

import { canTransitionOrder } from "./order-transitions";

test("only the payment webhook can settle an awaiting payment order", () => {
  assert.equal(canTransitionOrder("awaiting_payment", "paid"), true);
  assert.equal(canTransitionOrder("awaiting_payment", "cancelled"), true);
  assert.equal(canTransitionOrder("awaiting_payment", "completed"), false);
});

test("an admin cannot skip an unpaid or terminal order through fulfillment", () => {
  assert.equal(canTransitionOrder("created", "completed"), false);
  assert.equal(canTransitionOrder("created", "preparing"), false);
  assert.equal(canTransitionOrder("paid", "preparing"), true);
  assert.equal(canTransitionOrder("paid", "cancelled"), false);
  assert.equal(canTransitionOrder("preparing", "ready"), true);
  assert.equal(canTransitionOrder("ready", "completed"), true);
  assert.equal(canTransitionOrder("completed", "preparing"), false);
  assert.equal(canTransitionOrder("cancelled", "paid"), false);
});
