/**
 * Stoa Conformance — privacy class tests.
 *
 * Test #13 from STOA.md §19.1: Privacy class enforcement.
 * Refuse cross-zone PII routing; redact in receipts.
 *
 * Required for: L4 (Composable)
 * Spec reference: STOA.md §13 (Privacy classes), §19.1 #13
 */

import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #13 / STOA.md §13";
const LEVEL = "L4" as const;

/**
 * Test privacy class enforcement.
 *
 * v0 stub: sends a call flagged with PII.email to a non-compliant cap
 * and asserts a privacy_zone_mismatch error is returned.
 *
 * Real implementation:
 *   1. Identify a cap that is NOT declared as HIPAA-US or GDPR compliant
 *   2. Send a request with privacy.input_classes=["PHI.diagnosis"]
 *   3. Assert error.code="privacy_zone_mismatch" is returned
 *   4. Verify the error envelope includes a remediation URN to a compliant alternative
 */
export async function testPrivacyClass(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  results.push({
    test_id: "privacy-class.cross-zone-refused",
    description:
      "Sending PHI to a non-HIPAA cap returns error.code=privacy_zone_mismatch",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires sending a Stoa/1 request envelope with " +
      'privacy.input_classes=["PHI.diagnosis"] and asserting the 409 / ' +
      "privacy_zone_mismatch response. Implement once Stoa/1 request framing is available.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  results.push({
    test_id: "privacy-class.receipt-redacts-pii",
    description: "Receipt for PII-bearing call contains only hashes, not raw values",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: verify that receipt.input_hash and receipt.output_hash " +
      "are present but raw PII field values are absent from the receipt body.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
