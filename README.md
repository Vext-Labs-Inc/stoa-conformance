# @stoa/conformance

Automatable L0-L4 conformance test suite for Stoa-conformant vendors. Runs against any candidate Stoa host, emits a structured JSON report, and provides a CLI (`stoa-conformance test <url>`) for CI integration.

Spec: [STOA.md §19 — Conformance levels](https://github.com/stoa-spec/stoa-spec)

---

## The five conformance levels

| Level | Name | Requires |
|---|---|---|
| **L0** | Discoverable | `/.well-known/stoa.json` served and valid |
| **L1** | Typed | L0 + capability manifest with URNs, typed I/O, side-effect annotations |
| **L2** | Idempotent | L1 + idempotency + Idempotency-Key support + typed errors with remediation hints |
| **L3** | Stateful | L2 + state envelope on all responses + opaque continuation tokens + state-delta bus |
| **L4** | Composable | L3 + capability scopes + Acting-As headers + signed receipts + compensation + privacy classes + price oracle |

When **five independent vendors achieve L4**, the 5-vendor trigger fires: Vext Labs transfers editorial authority, trademark, and repository ownership of the Stoa spec to a neutral foundation (Linux Foundation candidate). See STOA.md §20.

---

## Install

```bash
npm install -g @stoa/conformance
# or as a dev dependency:
npm install --save-dev @stoa/conformance
```

---

## CLI usage

```bash
# Run the full L0-L4 suite and write a JSON report
stoa-conformance test https://api.hubspot.com

# Print JSON to stdout
stoa-conformance test https://api.hubspot.com --json

# Write to a specific file
stoa-conformance test https://api.hubspot.com --out ./hubspot-conformance.json

# Limit to L2 tests
stoa-conformance test https://api.hubspot.com --level L2

# Set a custom per-request timeout
stoa-conformance test https://api.hubspot.com --timeout 30000
```

Exit codes: `0` = all pass/warn, `1` = one or more failures, `2` = fatal runner error.

The report is written to `conformance-<host>-<date>.json` by default. Vendors host this at `conformance.report_url` in their `/.well-known/stoa.json`.

---

## Programmatic usage

```ts
import { runConformanceSuite, emitReportJson, printReportSummary } from "@stoa/conformance";

const report = await runConformanceSuite("https://api.hubspot.com", {
  timeout_ms: 15000,
});

printReportSummary(report);
// => prints human-readable summary to stdout

const json = emitReportJson(report);
// => formatted JSON string

console.log(report.level);   // "L0" | "L1" | "L2" | "L3" | "L4" | null
console.log(report.is_l4);   // true when this vendor hits L4
```

---

## Report shape (STOA.md §19.1)

```jsonc
{
  "report_version": "stoa-conformance-0.1",
  "target_url": "https://api.hubspot.com",
  "vendor_name": "HubSpot CRM",
  "tested_at": "2026-05-10T14:00:00.000Z",
  "level": "L2",
  "is_l4": false,
  "suite_results": [
    { "test_id": "discovery.well-known-resolves", "status": "pass", ... },
    { "test_id": "discovery.schema-valid", "status": "pass", ... }
  ],
  "capabilities": [
    {
      "capability_id": "crm.contacts.create",
      "achieved_level": "L2",
      "results": [
        { "test_id": "idempotency.duplicate-key-returns-same-id", "status": "pass", ... },
        { "test_id": "error-envelope.remediation-hints", "status": "pass", ... }
      ]
    }
  ],
  "summary": { "total": 24, "pass": 18, "fail": 0, "warn": 6, "skip": 0 },
  "duration_ms": 3421
}
```

---

## What the suite tests

For each declared capability:

1. Discovery roundtrip (`/.well-known/stoa.json` resolves + validates)
2. Side-effect annotations declared
3. Idempotency (same key, same result, no duplicate)
4. Error envelope shape + remediation hints
5. State envelope (`envelope.id` + `envelope.as_of`)
6. Scope enforcement (`forbidden` without proper scope)
7. Receipt signature (ES256 verified against vendor DID)
8. Compensation roundtrip (call + rollback + verify)
9. Privacy class enforcement (`privacy_zone_mismatch` on cross-zone PII)
10. Cost reconciliation (`actual_cents` within ceiling, matches receipt)

v0 note: tests 3 and 5-10 are stubs that emit `warn` — they require a live sandbox endpoint. The structure, types, CLI, and report shape are the deliverable of v0; real test logic lands in subsequent PRs.

---

## Links

- Stoa spec: https://github.com/stoa-spec/stoa-spec
- STOA.md §19: Conformance levels
- stoa-identity: https://github.com/Vext-Labs-Inc/stoa-identity
- stoa-bus: https://github.com/Vext-Labs-Inc/stoa-bus

---

## License

Apache-2.0. Copyright 2026 Vext Labs Inc.

The Stoa spec is CC-BY-4.0. This conformance suite is Apache-2.0.
Everything is open source, forever. See [STOA.md §2](https://github.com/stoa-spec/stoa-spec).
