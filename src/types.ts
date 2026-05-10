/**
 * Stoa Conformance — type definitions.
 *
 * Zod schemas for the conformance report and test result types,
 * as specified in STOA.md §19.1.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Conformance levels (STOA.md §19)
// ---------------------------------------------------------------------------

/**
 * The five Stoa conformance levels.
 *
 * L0 Discoverable  — discovery doc at /.well-known/stoa.json
 * L1 Typed         — L0 + capability manifest with URNs, typed I/O, side-effect annotations
 * L2 Idempotent    — L1 + idempotency declarations + typed errors with remediation hints
 * L3 Stateful      — L2 + state envelope + continuation tokens + state-delta bus
 * L4 Composable    — L3 + scopes + Acting-As + signed receipts + compensation + privacy + price oracle
 */
export const ConformanceLevelSchema = z.enum(["L0", "L1", "L2", "L3", "L4"]);
export type ConformanceLevel = z.infer<typeof ConformanceLevelSchema>;

export const CONFORMANCE_LEVEL_NAMES: Record<ConformanceLevel, string> = {
  L0: "Discoverable",
  L1: "Typed",
  L2: "Idempotent",
  L3: "Stateful",
  L4: "Composable",
};

// ---------------------------------------------------------------------------
// Individual test result
// ---------------------------------------------------------------------------

export const TestStatusSchema = z.enum(["pass", "fail", "warn", "skip"]);
export type TestStatus = z.infer<typeof TestStatusSchema>;

export const TestResultSchema = z.object({
  /** Unique test identifier, e.g. "discovery.well-known-resolves". */
  test_id: z.string(),
  /** Human-readable description of what was tested. */
  description: z.string(),
  /** The spec clause this test traces to (e.g. "STOA.md §19.1 #1"). */
  spec_ref: z.string(),
  /** Conformance level this test gates. */
  level: ConformanceLevelSchema,
  /** Pass, fail, warn, or skip (when the required endpoint is unavailable). */
  status: TestStatusSchema,
  /** Human-readable note. Required on fail/warn/skip. */
  note: z.string().optional(),
  /** HTTP status code returned during the test, if applicable. */
  http_status: z.number().int().optional(),
  /** Duration of the test in milliseconds. */
  duration_ms: z.number().nonnegative(),
  /** Which capability this result is scoped to. Null for suite-level tests. */
  capability_id: z.string().nullable(),
});

export type TestResult = z.infer<typeof TestResultSchema>;

// ---------------------------------------------------------------------------
// Capability entry (from the vendor's stoa.json / manifest)
// ---------------------------------------------------------------------------

export const SideEffectKindSchema = z.enum([
  "read",
  "create",
  "update",
  "delete",
  "action",
  "query",
]);

export const IdempotencyKindSchema = z.enum([
  "none",
  "client-key",
  "natural-key",
  "server-dedupe",
]);

export const CapabilityEntrySchema = z.object({
  /** Stable capability ID, e.g. "crm.contacts.create". */
  id: z.string(),
  /** Full capability URN, e.g. "urn:stoa:cap:hubspot.contacts.create@2.3.1". */
  urn: z.string().optional(),
  summary: z.string(),
  side_effects: z
    .object({
      kind: SideEffectKindSchema,
      idempotency: IdempotencyKindSchema.optional(),
      rollback: z.string().optional(),
      destructive: z.boolean().optional(),
      requires_confirmation: z.boolean().optional(),
    })
    .optional(),
  scopes: z.array(z.string()).optional(),
  errors: z
    .array(
      z.object({
        code: z.string(),
        remediation: z.string(),
      })
    )
    .optional(),
});

export type CapabilityEntry = z.infer<typeof CapabilityEntrySchema>;

// ---------------------------------------------------------------------------
// Discovery document (/.well-known/stoa.json)
// ---------------------------------------------------------------------------

export const StoaDiscoveryDocSchema = z.object({
  spec_version: z.string().regex(/^stoa-\d+\.\d+$/),
  vendor: z.object({
    name: z.string(),
    homepage: z.string().url().optional(),
    support_email: z.string().email().optional(),
    verified: z.boolean().optional(),
  }),
  manifest_url: z.string().url().optional(),
  openapi_url: z.string().url().optional(),
  mcp_url: z.string().url().optional(),
  auth: z
    .object({
      kinds: z.array(z.string()),
      oauth2_well_known: z.string().url().optional(),
    })
    .optional(),
  rate_limits: z
    .object({
      default_qps: z.number().positive(),
      burst: z.number().positive().optional(),
      documented_at: z.string().url().optional(),
    })
    .optional(),
  conformance: z
    .object({
      level: z.string(),
      tested_at: z.string().datetime().optional(),
      report_url: z.string().url().optional(),
    })
    .optional(),
});

export type StoaDiscoveryDoc = z.infer<typeof StoaDiscoveryDocSchema>;

// ---------------------------------------------------------------------------
// Conformance report (STOA.md §19.1)
// ---------------------------------------------------------------------------

export const ConformanceCapabilityResultSchema = z.object({
  capability_id: z.string(),
  urn: z.string().optional(),
  results: z.array(TestResultSchema),
  /** Highest level at which all tests for this capability passed. */
  achieved_level: ConformanceLevelSchema.nullable(),
});

export type ConformanceCapabilityResult = z.infer<
  typeof ConformanceCapabilityResultSchema
>;

/**
 * The JSON conformance report emitted by `stoa-conformance test`.
 * Vendors host this at `conformance.report_url` in their discovery doc.
 */
export const ConformanceReportSchema = z.object({
  /** Report schema version. */
  report_version: z.literal("stoa-conformance-0.1"),
  /** The base URL of the vendor that was tested. */
  target_url: z.string().url(),
  /** Vendor name from the discovery document. */
  vendor_name: z.string(),
  /** ISO-8601 timestamp when the suite ran. */
  tested_at: z.string().datetime(),
  /** Overall achieved conformance level. Null if even L0 failed. */
  level: ConformanceLevelSchema.nullable(),
  /**
   * Whether the vendor has reached L4. When five vendors do, the 5-vendor
   * handoff trigger fires and the spec transfers to a neutral foundation.
   */
  is_l4: z.boolean(),
  /** Suite-level test results (discovery, top-level checks). */
  suite_results: z.array(TestResultSchema),
  /** Per-capability results. */
  capabilities: z.array(ConformanceCapabilityResultSchema),
  /** Counts by status across all results. */
  summary: z.object({
    total: z.number().int().nonnegative(),
    pass: z.number().int().nonnegative(),
    fail: z.number().int().nonnegative(),
    warn: z.number().int().nonnegative(),
    skip: z.number().int().nonnegative(),
  }),
  /** Duration of the full suite run in milliseconds. */
  duration_ms: z.number().nonnegative(),
});

export type ConformanceReport = z.infer<typeof ConformanceReportSchema>;

// ---------------------------------------------------------------------------
// Test function type
// ---------------------------------------------------------------------------

/**
 * Signature for a conformance test function.
 * Each test module exports one or more functions matching this type.
 */
export type TestFn = (
  baseUrl: string,
  cap: CapabilityEntry,
  opts?: { timeout_ms?: number }
) => Promise<TestResult[]>;
