/**
 * Stoa Conformance — error envelope tests.
 *
 * Test #6 from STOA.md §19.1: Error envelope shape.
 * Every declared error code is reachable by a synthetic input;
 * the response matches SPEC_V0_1.md §5.
 *
 * Required for: L2 (Idempotent) — typed errors with remediation hints
 */

import { z } from "zod";
import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #6 / SPEC_V0_1.md §5";
const LEVEL = "L2" as const;

// Reserved error codes from SPEC_V0_1.md §5.3
const RESERVED_ERROR_CODES = new Set([
  "unauthenticated",
  "forbidden",
  "not_found",
  "validation_failed",
  "rate_limited",
  "idempotency_conflict",
  "state_conflict",
  "service_unavailable",
  "cost_limit_exceeded",
  "privacy_zone_mismatch",
  "human_confirmation_required",
  "compensation_required",
]);

const RemediationHints = new Set([
  "fix-input-and-retry",
  "backoff",
  "auth-refresh",
  "escalate-to-user",
  "permanent-failure",
  "search-then-update",
  "search-then-merge",
  "wait-and-poll",
  "compose-different-capabilities",
  "request-budget-increase",
  "route-to-compliant-vendor",
]);

// Minimal error envelope schema
const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    remediation: z.object({
      hint: z.string(),
    }).optional(),
    trace_id: z.string().optional(),
  }),
  envelope: z.object({
    id: z.null().or(z.string()),
    as_of: z.string().datetime(),
  }).optional(),
});

/**
 * Test error envelope conformance for a capability.
 *
 * Checks:
 *   1. All declared error codes are in the reserved set or are vendor-prefixed
 *   2. All declared errors have remediation hints from the allowed set
 *   3. (v0 stub) Sending invalid input returns validation_failed with correct envelope shape
 */
export async function testErrorEnvelope(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  const errors = cap.errors ?? [];

  // Test: All declared error codes are valid (reserved or vendor-prefixed)
  const invalidCodes = errors
    .map((e) => e.code)
    .filter((code) => !RESERVED_ERROR_CODES.has(code) && !code.includes(".") && !code.includes("_"));

  results.push({
    test_id: "error-envelope.declared-codes-valid",
    description:
      "All declared error codes are reserved codes or follow vendor namespace convention",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: invalidCodes.length === 0 ? "pass" : "warn",
    note:
      invalidCodes.length > 0
        ? `Unusual error codes (not reserved, not namespaced): ${invalidCodes.join(", ")}`
        : undefined,
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  // Test: All declared errors have remediation hints
  const missingHints = errors.filter((e) => !e.remediation);
  const invalidHints = errors.filter(
    (e) => e.remediation && !RemediationHints.has(e.remediation)
  );

  results.push({
    test_id: "error-envelope.remediation-hints",
    description:
      "All declared errors have a remediation hint from the allowed set",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status:
      missingHints.length === 0 && invalidHints.length === 0 ? "pass" : "fail",
    note:
      missingHints.length > 0
        ? `Errors missing remediation: ${missingHints.map((e) => e.code).join(", ")}`
        : invalidHints.length > 0
        ? `Errors with unrecognised remediation hint: ${invalidHints.map((e) => `${e.code}:${e.remediation}`).join(", ")}`
        : undefined,
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  // Test: Sending invalid input returns validation_failed (v0 stub)
  results.push({
    test_id: "error-envelope.invalid-input-returns-validation-failed",
    description:
      "Sending schema-invalid input returns error.code=validation_failed with error envelope",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires sending a deliberately invalid request to the endpoint " +
      "and asserting the error envelope shape matches SPEC_V0_1.md §5.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
