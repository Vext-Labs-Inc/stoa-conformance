/**
 * Stoa Conformance — scope enforcement tests.
 *
 * Test #7 from STOA.md §19.1: Scope enforcement.
 * Calls with insufficient scope return `forbidden` with the right scope-mismatch detail.
 *
 * Required for: L4 (Composable)
 */

import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #7 / SPEC_V0_1.md §6";
const LEVEL = "L4" as const;

/**
 * Test that the vendor correctly enforces capability-level scopes.
 *
 * v0 stub: warns. Real implementation:
 *   1. Send a request with no scope or an obviously insufficient scope
 *   2. Assert HTTP 403 / error.code="forbidden" is returned
 *   3. Assert the error envelope includes the required scope in error.details
 */
export async function testScopeEnforcement(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  const scopes = cap.scopes ?? [];

  if (scopes.length === 0) {
    results.push({
      test_id: "scope-enforcement.scopes-declared",
      description: "Capability declares required scopes",
      spec_ref: SPEC_REF,
      level: LEVEL,
      status: "warn",
      note:
        `Cap "${cap.id}" has no declared scopes. ` +
        "Scope declarations are required for L4 (Composable) conformance.",
      duration_ms: Date.now() - t0,
      capability_id: cap.id,
    });
    return results;
  }

  results.push({
    test_id: "scope-enforcement.scopes-declared",
    description: "Capability declares required scopes",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "pass",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  // v0 stub for the live enforcement test
  results.push({
    test_id: "scope-enforcement.forbidden-without-scope",
    description:
      "Request without required scope returns error.code=forbidden",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires sending a request with an empty or wrong scope claim " +
      "and asserting HTTP 403 + error.code=forbidden is returned.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
