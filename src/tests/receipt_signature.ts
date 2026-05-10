/**
 * Stoa Conformance — receipt signature tests.
 *
 * Test #10 from STOA.md §19.1: Receipt signature validity.
 * Verifies the receipt signature on a successful call.
 *
 * Required for: L4 (Composable)
 */

import type { TestResult, CapabilityEntry } from "../types.js";

const SPEC_REF = "STOA.md §19.1 #10 / STOA.md §11";
const LEVEL = "L4" as const;

/**
 * Test receipt signature validity.
 *
 * Real implementation (post-v0):
 *   1. Make a successful call to the capability
 *   2. Extract response.receipt
 *   3. Resolve vendor_did to get the public key
 *   4. Verify ES256 signature over (cap, agent, ts, cost, input_hash, output_hash, state_delta_hash)
 *   5. Verify Merkle inclusion proof against the daily root
 */
export async function testReceiptSignature(
  baseUrl: string,
  cap: CapabilityEntry,
  _opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const t0 = Date.now();

  results.push({
    test_id: "receipt-signature.sig-verifiable",
    description:
      "Receipt ES256 signature verifies against vendor DID public key",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: requires a live successful call to the cap. " +
      "Implement by: (1) call cap with valid input, (2) resolve vendor_did, " +
      "(3) importJWK verificationMethod, (4) jwtVerify(receipt.sig).",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  results.push({
    test_id: "receipt-signature.merkle-proof-valid",
    description: "Receipt Merkle proof verifies against daily root",
    spec_ref: SPEC_REF,
    level: LEVEL,
    status: "warn",
    note:
      "v0 stub: daily Merkle anchoring (Sigstore Rekor-style) is part of L4. " +
      "Implement once stoa-receipts library ships.",
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  });

  return results;
}
