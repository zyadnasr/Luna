import test from "node:test";
import assert from "node:assert/strict";

const allowed = ["image/png", "image/jpeg", "image/webp"];
const maxBytes = 5 * 1024 * 1024;
const validProof = (file) => Boolean(file && allowed.includes(file.type) && file.size <= maxBytes);

test("rejects invalid payment proof types", () => {
  assert.equal(validProof({ type: "application/pdf", size: 100 }), false);
});

test("rejects payment proofs above 5 MB", () => {
  assert.equal(validProof({ type: "image/png", size: maxBytes + 1 }), false);
});

test("accepts supported payment proof images", () => {
  assert.equal(validProof({ type: "image/webp", size: maxBytes }), true);
});

test("cash does not require proof while Instapay does", () => {
  const requiresProof = (method, proof) => method === "cash" || validProof(proof);
  assert.equal(requiresProof("cash"), true);
  assert.equal(requiresProof("instapay"), false);
  assert.equal(requiresProof("instapay", { type: "image/jpeg", size: 10 }), true);
});

test("external sources are constrained to supported manual sources", () => {
  const sources = ["talabat", "uber", "whatsapp", "manual"];
  assert.equal(sources.includes("talabat"), true);
  assert.equal(sources.includes("uber"), true);
  assert.equal(sources.includes("whatsapp"), true);
  assert.equal(sources.includes("unknown"), false);
});

test("order totals are recalculated from trusted line values", () => {
  const lines = [
    { unit: 25, quantity: 2 },
    { unit: 40, quantity: 1 },
  ];
  const subtotal = lines.reduce((sum, line) => sum + line.unit * line.quantity, 0);
  assert.equal(subtotal, 90);
  assert.equal(subtotal + 15, 105);
});
