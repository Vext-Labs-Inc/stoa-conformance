/**
 * Stoa Conformance — idempotency tests.
 *
 * Test #3 from STOA.md §19.1: Idempotency.
 * Repeat a `create` with the same key; second call returns the same ID
 * without creating a duplicate.
 *
 * Required for: L2 (Idempotent)
 *
 * v0 stub: always passes when called against a stub. Real test logic lands
 * in a subsequent PR once vendor sandbox endpoints are integrated.
 */

import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #3";
const LEVEL = "L2" as const;

/**
 * Run idempotency tests for a capability.
 *
 * For L2 conformance, capabilities with idempotency="client-key" must:
 *   - Accept an Idempotency-Key header
 *   - Return the same response (same output ID) on duplicate calls
 *   - Not create duplicate resources
 */
export async function testIdempotency(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  const idempotency = cap.side_effects?.idempotency;

  // Skip if capability is not declared as idempotent
  if (!idempotency || idempotency === "none") {
    results.push({
      test_id: "idempotency.not-applicable",
      description: "Capability has idempotency=none — skip idempotency test",
      spec_ref: SPEC_REF,
      level: LEVEL,
      status: "skip",
      note:
        `Cap "${cap.id}" declares idempotency="${idempotency ?? "none"}". ` +
        "Idempotency-Key test is only applicable to client-key, natural-key, server-dedupe caps.",
      duration_ms: Date.now() - t0,
      capability_id: cap.id,
    });
    return results;
  }

  // v0 stub: placeholder that always passes
  // TODO: send two identical requests with the same Idempotency-Key header,
  //       assert response IDs match, assert no duplicate in vendor state.
  results.push({
    test_id: "idempotency.duplicate-key-returns-same-id",
    description: "Two calls with same Idempotency-Key return same output ID",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: this test requires a live vendor sandbox endpoint. " +
      "Marking as warn (not fail) — implement by pointing at a vendor test environment.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  results.push({
    test_id: "idempotency.no-duplicate-resource",
    description: "Duplicate call does not create a second resource",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires vendor list-endpoint to verify no duplicate was created.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
