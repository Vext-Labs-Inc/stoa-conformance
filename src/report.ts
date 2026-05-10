/**
 * Stoa Conformance — JSON report emitter.
 *
 * Formats the conformance report for output to stdout or a file.
 * Vendors host the emitted report at conformance.report_url in their
 * discovery document.
 */

import {
  type ConformanceReport,
  type ConformanceLevel,
  CONFORMANCE_LEVEL_NAMES,
} from "./types.js";

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

/**
 * Serialize a conformance report to a formatted JSON string.
 *
 * @param report - The report to emit
 * @param pretty - Whether to pretty-print. Defaults to true.
 */
export function emitReportJson(
  report: ConformanceReport,
  pretty = true
): string {
  return JSON.stringify(report, null, pretty ? 2 : undefined);
}

/**
 * Derive the output filename for a conformance report.
 * Convention: conformance-<host>-<date>.json
 *
 * @param report - The conformance report
 */
export function reportFilename(report: ConformanceReport): string {
  let host: string;
  try {
    host = new URL(report.target_url).hostname;
  } catch {
    host = "unknown";
  }
  const date = report.tested_at.slice(0, 10); // YYYY-MM-DD
  return `conformance-${host}-${date}.json`;
}

// ---------------------------------------------------------------------------
// Human-readable summary (for CLI output)
// ---------------------------------------------------------------------------

/**
 * Emit a human-readable summary of the conformance report to stdout.
 */
export function printReportSummary(report: ConformanceReport): void {
  const levelLabel =
    report.level !== null
      ? `${report.level} — ${CONFORMANCE_LEVEL_NAMES[report.level]}`
      : "NONE (failed L0)";

  const lines: string[] = [
    "",
    `Stoa Conformance Report`,
    `=======================`,
    `Target:     ${report.target_url}`,
    `Vendor:     ${report.vendor_name}`,
    `Tested at:  ${report.tested_at}`,
    `Level:      ${levelLabel}`,
    ``,
    `Summary`,
    `-------`,
    `  Total:    ${report.summary.total}`,
    `  Pass:     ${report.summary.pass}`,
    `  Fail:     ${report.summary.fail}`,
    `  Warn:     ${report.summary.warn}`,
    `  Skip:     ${report.summary.skip}`,
    `  Duration: ${report.duration_ms}ms`,
    ``,
  ];

  if (report.summary.fail > 0) {
    lines.push("Failures");
    lines.push("--------");
    const allResults = [
      ...report.suite_results,
      ...report.capabilities.flatMap((c) => c.results),
    ];
    for (const r of allResults.filter((r) => r.status === "fail")) {
      const capNote = r.capability_id ? ` [${r.capability_id}]` : "";
      lines.push(`  FAIL${capNote}: ${r.test_id}`);
      if (r.note) lines.push(`       ${r.note}`);
    }
    lines.push("");
  }

  if (report.is_l4) {
    lines.push(
      "This vendor has achieved L4 (Composable) conformance.",
      "When 5 independent vendors reach L4, the 5-vendor trigger fires and",
      "the Stoa spec transfers to a neutral foundation. See STOA.md §20.",
      ""
    );
  }

  console.log(lines.join("\n"));
}
