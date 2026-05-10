/**
 * Stoa Conformance — discovery tests.
 *
 * Test #1 from STOA.md §19.1: Discovery roundtrip.
 * GET /.well-known/stoa.json resolves; manifest URL resolves;
 * manifest validates against the v0.1 JSON Schema.
 *
 * Required for: L0 (Discoverable)
 */

import {
  type TestResult,
  type CapabilityEntry,
  StoaDiscoveryDocSchema,
} from "../types.js";

const SPEC_REF = "STOA.md §19.1 #1";
const LEVEL = "L0" as const;

/**
 * Run all discovery tests against the target host.
 * This is a suite-level test — `cap` is ignored (pass the first capability or a stub).
 */
export async function testDiscovery(
  baseUrl: string,
  _cap: CapabilityEntry,
  opts?: { timeout_ms?: number }
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const timeout = opts?.timeout_ms ?? 10000;
  const url = `${baseUrl.replace(/\/$/, "")}/.well-known/stoa.json`;

  // Test 1a: /.well-known/stoa.json resolves with HTTP 200
  const t0 = Date.now();
  let discoveryDoc: unknown = null;
  let httpStatus = 0;

  try {
    const response = await fetchWithTimeout(url, timeout);
    httpStatus = response.status;

    if (!response.ok) {
      results.push(makeResult({
        test_id: "discovery.well-known-resolves",
        description: "GET /.well-known/stoa.json returns HTTP 200",
        status: "fail",
        note: `HTTP ${response.status} returned from ${url}`,
        http_status: response.status,
        duration_ms: Date.now() - t0,
      }));
      return results;
    }

    discoveryDoc = await response.json();
  } catch (err) {
    results.push(makeResult({
      test_id: "discovery.well-known-resolves",
      description: "GET /.well-known/stoa.json returns HTTP 200",
      status: "fail",
      note: `Fetch failed: ${String(err)}`,
      duration_ms: Date.now() - t0,
    }));
    return results;
  }

  results.push(makeResult({
    test_id: "discovery.well-known-resolves",
    description: "GET /.well-known/stoa.json returns HTTP 200",
    status: "pass",
    http_status: httpStatus,
    duration_ms: Date.now() - t0,
  }));

  // Test 1b: Document validates against StoaDiscoveryDocSchema
  const t1 = Date.now();
  const parsed = StoaDiscoveryDocSchema.safeParse(discoveryDoc);
  if (!parsed.success) {
    results.push(makeResult({
      test_id: "discovery.schema-valid",
      description: "Discovery document validates against Stoa v0.1 schema",
      status: "fail",
      note: `Schema validation failed: ${parsed.error.message}`,
      duration_ms: Date.now() - t1,
    }));
    return results;
  }

  results.push(makeResult({
    test_id: "discovery.schema-valid",
    description: "Discovery document validates against Stoa v0.1 schema",
    status: "pass",
    duration_ms: Date.now() - t1,
  }));

  // Test 1c: spec_version is stoa-0.x
  const t2 = Date.now();
  const specVersion = parsed.data.spec_version;
  const versionOk = /^stoa-0\.\d+$/.test(specVersion);
  results.push(makeResult({
    test_id: "discovery.spec-version",
    description: "spec_version is stoa-0.x (forward-compatible v0 declaration)",
    status: versionOk ? "pass" : "warn",
    note: versionOk
      ? undefined
      : `spec_version "${specVersion}" is not in the expected stoa-0.x range`,
    duration_ms: Date.now() - t2,
  }));

  // Test 1d: manifest_url resolves (warn if absent, since it's optional at L0)
  const t3 = Date.now();
  const manifestUrl = parsed.data.manifest_url;
  if (!manifestUrl) {
    results.push(makeResult({
      test_id: "discovery.manifest-url-resolves",
      description: "manifest_url declared and resolves",
      status: "warn",
      note: "manifest_url is absent — required for L1 (Typed) conformance",
      duration_ms: Date.now() - t3,
    }));
  } else {
    try {
      const manifestResp = await fetchWithTimeout(manifestUrl, timeout);
      results.push(makeResult({
        test_id: "discovery.manifest-url-resolves",
        description: "manifest_url declared and resolves",
        status: manifestResp.ok ? "pass" : "fail",
        note: manifestResp.ok
          ? undefined
          : `manifest_url returned HTTP ${manifestResp.status}`,
        http_status: manifestResp.status,
        duration_ms: Date.now() - t3,
      }));
    } catch (err) {
      results.push(makeResult({
        test_id: "discovery.manifest-url-resolves",
        description: "manifest_url declared and resolves",
        status: "fail",
        note: `manifest_url fetch failed: ${String(err)}`,
        duration_ms: Date.now() - t3,
      }));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, timeout_ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout_ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function makeResult(
  fields: Partial<TestResult> & { test_id: string; description: string; status: TestResult["status"]; duration_ms: number }
): TestResult {
  return {
    spec_ref: SPEC_REF,
    level: LEVEL,
    capability_id: null,
    ...fields,
  };
}
