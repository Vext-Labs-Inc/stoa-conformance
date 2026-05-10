#!/usr/bin/env node
/**
 * stoa-conformance CLI
 *
 * Usage:
 *   stoa-conformance test <url>         Run the full L0-L4 suite against a host
 *   stoa-conformance test <url> --level L2   Stop after a specific level
 *   stoa-conformance test <url> --timeout 30000
 *   stoa-conformance test <url> --out ./report.json   Write to a file instead of stdout
 *
 * Exit codes:
 *   0 — All tests passed (or only warnings)
 *   1 — One or more tests failed
 *   2 — Invalid arguments or suite could not run
 */

import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { runConformanceSuite } from "../src/runner.js";
import {
  emitReportJson,
  reportFilename,
  printReportSummary,
} from "../src/report.js";
import { CONFORMANCE_LEVEL_NAMES } from "../src/types.js";

const program = new Command();

program
  .name("stoa-conformance")
  .description(
    "Stoa conformance test suite — automatable L0-L4 tests for Stoa-conformant vendors"
  )
  .version("0.1.0");

program
  .command("test <url>")
  .description(
    "Run the Stoa conformance suite against a vendor URL.\n" +
      "Emits a JSON report to stdout or --out <file>.\n\n" +
      "Conformance levels:\n" +
      Object.entries(CONFORMANCE_LEVEL_NAMES)
        .map(([l, name]) => `  ${l}  ${name}`)
        .join("\n")
  )
  .option(
    "-l, --level <level>",
    "Highest level to test (L0-L4). Defaults to L4.",
    "L4"
  )
  .option(
    "-t, --timeout <ms>",
    "Per-request timeout in milliseconds. Defaults to 15000.",
    "15000"
  )
  .option(
    "-o, --out <file>",
    "Write JSON report to a file. Defaults to conformance-<host>-<date>.json."
  )
  .option("--json", "Print JSON report to stdout (default: human summary + JSON file)")
  .option("--offline", "Skip network calls — only validate manifest schema")
  .action(async (url: string, opts: {
    level: string;
    timeout: string;
    out?: string;
    json?: boolean;
    offline?: boolean;
  }) => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      console.error(`Error: "${url}" is not a valid URL.`);
      process.exit(2);
    }

    const timeoutMs = parseInt(opts.timeout, 10);
    if (isNaN(timeoutMs) || timeoutMs <= 0) {
      console.error(`Error: --timeout must be a positive integer.`);
      process.exit(2);
    }

    console.error(`Running Stoa conformance suite against ${url} ...`);

    let report;
    try {
      report = await runConformanceSuite(url, {
        timeout_ms: timeoutMs,
        offline: opts.offline,
      });
    } catch (err) {
      console.error(`Fatal: suite runner threw: ${String(err)}`);
      process.exit(2);
    }

    const json = emitReportJson(report);
    const outFile = opts.out ?? reportFilename(report);

    if (opts.json) {
      // Just print JSON to stdout
      process.stdout.write(json + "\n");
    } else {
      // Print human summary to stderr, write JSON to file
      printReportSummary(report);
      try {
        writeFileSync(outFile, json, "utf8");
        console.error(`Report written to: ${outFile}`);
      } catch (err) {
        console.error(`Warning: could not write report file: ${String(err)}`);
        console.error("Printing to stdout instead:");
        process.stdout.write(json + "\n");
      }
    }

    // Exit 1 if any failures
    const hasFail = report.summary.fail > 0;
    process.exit(hasFail ? 1 : 0);
  });

program.parse();
