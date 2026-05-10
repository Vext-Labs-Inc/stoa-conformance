/**
 * Stoa Conformance — compensation tests.
 *
 * Test #12 from STOA.md §19.1: Compensation roundtrip.
 * Call cap, then call its declared compensation; verify state rollback.
 *
 * Required for: L4 (Composable)
 * Spec reference: STOA.md §9 (Sagas & compensation), §19.1 #12
 */

import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #12 / STOA.md §9";
const LEVEL = "L4" as const;

/**
 * Test compensation (saga rollback) for a capability.
 *
 * Real implementation:
 *   1. Call the capability (create a resource)
 *   2. Identify the compensation URN from the capability graph entry
 *   3. Call the compensation cap with the returned ID
 *   4. Verify the resource no longer exists (or is reverted)
 *   5. Verify a compensation receipt was issued
 */
export async function testCompensation(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  const rollback = cap.side_effects?.rollback;
  const isDestructive = cap.side_effects?.destructive;

  // Skip if no rollback declared
  if (!rollback || rollback === "none") {
    results.push({
      test_id: "compensation.rollback-declared",
      description: "Capability declares a rollback/compensation path",
      spec_ref: SPEC_REF,
      level: LEVEL,
      status: "skip",
      note:
        `Cap "${cap.id}" declares rollback="${rollback ?? "none"}". ` +
        "Compensation test skipped. Note: destructive caps without rollback " +
        "should declare requires_confirmation:true.",
      duration_ms: Date.now() - t0,
      capability_id: cap.id,
    });
    return results;
  }

  results.push({
    test_id: "compensation.rollback-declared",
    description: "Capability declares a rollback/compensation path",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "pass",
    note: `rollback="${rollback}"`,
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  // v0 stub for the live roundtrip test
  results.push({
    test_id: "compensation.roundtrip",
    description:
      "Call cap → call compensation → verify resource is rolled back",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: full compensation roundtrip requires a live sandbox endpoint. " +
      "Implement by: (1) call cap, (2) call compensation with returned ID, " +
      "(3) assert resource is gone or reverted, (4) assert compensation receipt issued.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
