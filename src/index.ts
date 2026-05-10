/**
 * @stoa/conformance — public API surface
 *
 * Automatable L0-L4 conformance test suite for Stoa-conformant vendors.
 * Run via CLI: `stoa-conformance test https://example.com`
 * Or use programmatically via `runConformanceSuite()`.
 *
 * Spec reference: STOA.md §19 (Conformance levels)
 *
 * @example
 * ```ts
 * import { runConformanceSuite, emitReportJson } from "@stoa/conformance";
 *
 * const report = await runConformanceSuite("https://api.hubspot.com");
 * console.log(emitReportJson(report));
 * // => { report_version: "stoa-conformance-0.1", level: "L0", ... }
 * ```
 */

// Types — re-export all public types and schemas
export type {
  ConformanceLevel,
  ConformanceReport,
  ConformanceCapabilityResult,
  TestResult,
  TestStatus,
  TestFn,
  CapabilityEntry,
  StoaDiscoveryDoc,
} from "./types.js";

export {
  ConformanceLevelSchema,
  ConformanceReportSchema,
  ConformanceCapabilityResultSchema,
  TestResultSchema,
  TestStatusSchema,
  CapabilityEntrySchema,
  StoaDiscoveryDocSchema,
  CONFORMANCE_LEVEL_NAMES,
} from "./types.js";

// Runner
export type { RunnerOptions } from "./runner.js";
export { runConformanceSuite } from "./runner.js";

// Report emitter
export { emitReportJson, reportFilename, printReportSummary } from "./report.js";

// Individual test functions (for custom runners)
export { testDiscovery } from "./tests/discovery.js";
export { testIdempotency } from "./tests/idempotency.js";
export { testStateEnvelope } from "./tests/state_envelope.js";
export { testErrorEnvelope } from "./tests/error_envelope.js";
export { testScopeEnforcement } from "./tests/scope_enforcement.js";
export { testReceiptSignature } from "./tests/receipt_signature.js";
export { testCompensation } from "./tests/compensation.js";
export { testPrivacyClass } from "./tests/privacy_class.js";
export { testCostReconciliation } from "./tests/cost_reconciliation.js";

// ---------------------------------------------------------------------------
// Package metadata
// ---------------------------------------------------------------------------

export const STOA_CONFORMANCE_VERSION = "0.1.0";
export const SPEC_VERSION = "stoa-0.1";
