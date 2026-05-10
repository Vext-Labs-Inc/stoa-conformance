/**
 * Stoa Conformance — state envelope tests.
 *
 * Test #4 from STOA.md §19.1: State envelope.
 * All responses include `envelope.id` and `envelope.as_of`.
 *
 * Spec reference: SPEC_V0_1.md §4 (State envelope), STOA.md §19.1 #4
 * Required for: L3 (Stateful)
 */

import { z } from "zod";
import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #4 / SPEC_V0_1.md §4";
const LEVEL = "L3" as const;

// Minimal envelope shape we require
const EnvelopeSchema = z.object({
  envelope: z.object({
    id: z.string().min(1),
    as_of: z.string().datetime(),
  }),
});

/**
 * Test that capability responses include the mandatory state envelope fields.
 *
 * v0 stub: always warns — real implementation sends a live request to the cap
 * and validates the response shape.
 */
export async function testStateEnvelope(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  // v0 stub — real implementation would POST to cap.openapi_path and inspect response
  results.push({
    test_id: "state-envelope.id-present",
    description: "Response includes envelope.id (canonical resource ID)",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires a live request to the capability endpoint. " +
      "Implement by posting a valid synthetic input and asserting response.envelope.id is non-empty.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  results.push({
    test_id: "state-envelope.as_of-present",
    description: "Response includes envelope.as_of (ISO-8601 server timestamp)",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note: "v0 stub: same as above — check response.envelope.as_of is a valid ISO-8601 datetime.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
