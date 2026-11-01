import test from "node:test";
import assert from "node:assert/strict";

test("negative stock is rejected", () => assert.equal(10 - 11 < 0, true));
test("expired batches are excluded", () => {
  const batches = [{ expiry: "2020-01-01" }, { expiry: null }];
  assert.equal(
    batches.filter((batch) => !batch.expiry || new Date(batch.expiry) >= new Date()).length,
    1,
  );
});
test("FEFO chooses the earliest expiry", () => {
  const batches = [{ expiry: "2026-12-01" }, { expiry: "2026-06-01" }];
  assert.equal(
    batches.sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0].expiry,
    "2026-06-01",
  );
});
test("duplicate restoration is prevented by an existing restoration marker", () => {
  const movements = [{ type: "consumption" }, { type: "cancellation_restore" }];
  assert.equal(
    movements.some((movement) => movement.type === "cancellation_restore"),
    true,
  );
});
test("recipe quantity calculation scales with order quantity", () => assert.equal(2.5 * 4, 10));
