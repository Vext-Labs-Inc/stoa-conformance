/**
 * Stoa Conformance — cost reconciliation tests.
 *
 * Test #14 from STOA.md §19.1: Cost reconciliation.
 * Assert cost.actual_cents is within the declared ceiling and matches receipt.
 *
 * Required for: L4 (Composable)
 * Spec reference: STOA.md §10 (Cost & settlement), §19.1 #14
 */

import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #14 / STOA.md §10";
const LEVEL = "L4" as const;

/**
 * Test cost reconciliation.
 *
 * v0 stub. Real implementation:
 *   1. Look up the cap's declared price from the capability graph
 *   2. Call the cap with budget.ceiling_cents = declared price + 20% buffer
 *   3. Assert response.cost.actual_cents <= ceiling_cents
 *   4. Assert response.cost.actual_cents matches receipt.cost_actual_cents
 *   5. Assert cost.settlement_ref is present and has the right format for the declared rail
 */
export async function testCostReconciliation(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  results.push({
    test_id: "cost-reconciliation.actual-within-ceiling",
    description: "cost.actual_cents is within the declared budget ceiling",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires calling the cap with a declared ceiling and asserting " +
      "response.cost.actual_cents <= ceiling_cents.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  results.push({
    test_id: "cost-reconciliation.matches-receipt",
    description: "response.cost.actual_cents matches receipt.cost_actual_cents",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: verify that the cost reported in the response envelope matches " +
      "the cost in the signed receipt to prevent cost-splitting attacks.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  results.push({
    test_id: "cost-reconciliation.settlement-ref-present",
    description: "cost.settlement_ref is present and follows declared settlement rail format",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: check settlement_ref format matches one of: " +
      "stripe:*, x402-escrow:0x*, ach-net30, prepaid:stoa-credits, sap-procurement.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
