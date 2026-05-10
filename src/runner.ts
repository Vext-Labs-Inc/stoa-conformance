/**
 * Stoa Conformance — suite runner.
 *
 * Orchestrates all conformance tests for a target host.
 * For each declared capability, runs all applicable tests based on the
 * target conformance level.
 *
 * Spec reference: STOA.md §19.1
 */

import {
  type ConformanceReport,
  type ConformanceCapabilityResult,
  type TestResult,
  type ConformanceLevel,
  type CapabilityEntry,
  type StoaDiscoveryDoc,
  StoaDiscoveryDocSchema,
} from "./types.js";
import { testDiscovery } from "./tests/discovery.js";
import { testIdempotency } from "./tests/idempotency.js";
import { testStateEnvelope } from "./tests/state_envelope.js";
import { testErrorEnvelope } from "./tests/error_envelope.js";
import { testScopeEnforcement } from "./tests/scope_enforcement.js";
import { testReceiptSignature } from "./tests/receipt_signature.js";
import { testCompensation } from "./tests/compensation.js";
import { testPrivacyClass } from "./tests/privacy_class.js";
import { testCostReconciliation } from "./tests/cost_reconciliation.js";

// ---------------------------------------------------------------------------
// Level ordering (for achieved level computation)
// ---------------------------------------------------------------------------

const LEVEL_ORDER: ConformanceLevel[] = ["L0", "L1", "L2", "L3", "L4"];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface RunnerOptions {
  timeout_ms?: number;
  /** Skip network calls — useful for offline schema-only checks. */
  offline?: boolean;
}

/**
 * Run the full conformance suite against a target URL.
 *
 * @param targetUrl - Base URL of the vendor to test (e.g. "https://api.hubspot.com")
 * @param opts - Runner options
 * @returns Complete conformance report
 */
export async function runConformanceSuite(
  targetUrl: string,
  opts: RunnerOptions = {}
): Promise<ConformanceReport> {
  const startedAt = new Date();
  const t0 = Date.now();

  const baseUrl = targetUrl.replace(/\/$/, "");
  const timeoutMs = opts.timeout_ms ?? 15000;

  // --- Step 1: Fetch and validate discovery document ---
  let discoveryDoc: StoaDiscoveryDoc | null = null;
  let vendorName = "unknown";
  const suiteResults: TestResult[] = [];

  // Use a stub capability for suite-level tests
  const stubCap: CapabilityEntry = { id: "__suite__", summary: "suite-level" };

  const discoveryResults = await testDiscovery(baseUrl, stubCap, { timeout_ms: timeoutMs });
  suiteResults.push(...discoveryResults);

  const discoveryPassed = discoveryResults.every((r) => r.status !== "fail");

  if (discoveryPassed) {
    try {
      const resp = await fetch(`${baseUrl}/.well-known/stoa.json`);
      if (resp.ok) {
        const raw = await resp.json() as unknown;
        const parsed = StoaDiscoveryDocSchema.safeParse(raw);
        if (parsed.success) {
          discoveryDoc = parsed.data;
          vendorName = parsed.data.vendor.name;
        }
      }
    } catch {
      // Discovery test already captured this failure
    }
  }

  // --- Step 2: Load capability manifest ---
  let capabilities: CapabilityEntry[] = [];
  if (discoveryDoc?.manifest_url) {
    capabilities = await _loadCapabilities(discoveryDoc.manifest_url, timeoutMs);
  }

  if (capabilities.length === 0) {
    // Add a warning if no capabilities could be loaded
    suiteResults.push({
      test_id: "suite.capabilities-loaded",
      description: "Capability manifest loaded and parsed",
      spec_ref: "STOA.md §19.1",
      level: "L1",
      status: "warn",
      note: "No capabilities found. Ensure manifest_url is set in /.well-known/stoa.json and returns a valid manifest.",
      duration_ms: 0,
      capability_id: null,
    });
    // Use an empty stub capability so the per-cap loop still runs
    capabilities = [];
  }

  // --- Step 3: Run per-capability tests ---
  const capabilityResults: ConformanceCapabilityResult[] = [];

  for (const cap of capabilities) {
    const capResults: TestResult[] = [];

    // L0 — nothing per-cap beyond discovery (already tested at suite level)

    // L1 — typed I/O check (schema presence)
    capResults.push(_checkL1Schema(cap));

    // L2 — idempotency + error envelope
    capResults.push(...(await testIdempotency(baseUrl, cap, { timeout_ms: timeoutMs })));
    capResults.push(...(await testErrorEnvelope(baseUrl, cap, { timeout_ms: timeoutMs })));

    // L3 — state envelope
    capResults.push(...(await testStateEnvelope(baseUrl, cap, { timeout_ms: timeoutMs })));

    // L4 — scope enforcement, receipt sig, compensation, privacy, cost
    capResults.push(...(await testScopeEnforcement(baseUrl, cap, { timeout_ms: timeoutMs })));
    capResults.push(...(await testReceiptSignature(baseUrl, cap, { timeout_ms: timeoutMs })));
    capResults.push(...(await testCompensation(baseUrl, cap, { timeout_ms: timeoutMs })));
    capResults.push(...(await testPrivacyClass(baseUrl, cap, { timeout_ms: timeoutMs })));
    capResults.push(...(await testCostReconciliation(baseUrl, cap, { timeout_ms: timeoutMs })));

    const achievedLevel = _computeAchievedLevel(capResults);

    capabilityResults.push({
      capability_id: cap.id,
      urn: cap.urn,
      results: capResults,
      achieved_level: achievedLevel,
    });
  }

  // --- Step 4: Compute overall level ---
  const allResults = [
    ...suiteResults,
    ...capabilityResults.flatMap((c) => c.results),
  ];

  const overallLevel = _computeOverallLevel(suiteResults, capabilityResults);

  // --- Step 5: Build report ---
  const summary = _summarize(allResults);
  const durationMs = Date.now() - t0;

  const report: ConformanceReport = {
    report_version: "stoa-conformance-0.1",
    target_url: targetUrl,
    vendor_name: vendorName,
    tested_at: startedAt.toISOString(),
    level: overallLevel,
    is_l4: overallLevel === "L4",
    suite_results: suiteResults,
    capabilities: capabilityResults,
    summary,
    duration_ms: durationMs,
  };

  return report;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _checkL1Schema(cap: CapabilityEntry): TestResult {
  const t0 = Date.now();
  const hasSideEffects = !!cap.side_effects;
  return {
    test_id: "typed.side-effects-declared",
    description: "Capability declares side_effects annotation",
    spec_ref: "STOA.md §19.1 / SPEC_V0_1.md §3.3",
    level: "L1",
    status: hasSideEffects ? "pass" : "fail",
    note: hasSideEffects
      ? undefined
      : `Cap "${cap.id}" is missing side_effects block — required for L1 (Typed)`,
    duration_ms: Date.now() - t0,
    capability_id: cap.id,
  };
}

function _computeAchievedLevel(results: TestResult[]): ConformanceLevel | null {
  for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
    const level = LEVEL_ORDER[i]!;
    const levelResults = results.filter((r) => r.level === level);
    const hasFail = levelResults.some((r) => r.status === "fail");
    if (!hasFail && levelResults.length > 0) {
      return level;
    }
  }
  return null;
}

function _computeOverallLevel(
  suiteResults: TestResult[],
  capResults: ConformanceCapabilityResult[]
): ConformanceLevel | null {
  // L0: all suite-level tests pass
  const l0Fails = suiteResults
    .filter((r) => r.level === "L0")
    .some((r) => r.status === "fail");

  if (l0Fails) return null;

  if (capResults.length === 0) return "L0";

  // Overall level = lowest achieved level across all capabilities
  let lowestIdx = LEVEL_ORDER.length - 1;
  for (const cap of capResults) {
    if (cap.achieved_level === null) return null;
    const idx = LEVEL_ORDER.indexOf(cap.achieved_level);
    if (idx < lowestIdx) lowestIdx = idx;
  }

  return LEVEL_ORDER[lowestIdx] ?? null;
}

function _summarize(
  results: TestResult[]
): ConformanceReport["summary"] {
  const out = { total: results.length, pass: 0, fail: 0, warn: 0, skip: 0 };
  for (const r of results) {
    out[r.status]++;
  }
  return out;
}

async function _loadCapabilities(
  manifestUrl: string,
  timeout_ms: number
): Promise<CapabilityEntry[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout_ms);
    const resp = await fetch(manifestUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) return [];

    const raw = await resp.json() as unknown;
    if (
      typeof raw === "object" &&
      raw !== null &&
      "capabilities" in raw &&
      Array.isArray((raw as Record<string, unknown>)["capabilities"])
    ) {
      return (raw as { capabilities: CapabilityEntry[] }).capabilities;
    }
  } catch {
    // Ignore — suite-level warning covers this
  }
  return [];
}
