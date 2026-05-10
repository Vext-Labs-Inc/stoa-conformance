# Contributing to stoa-conformance

Thank you for your interest in contributing.

## Where the spec lives

The authoritative specification is at [github.com/stoa-spec/stoa-spec](https://github.com/stoa-spec/stoa-spec).
Conformance levels are defined in STOA.md §19. All test logic must trace to a specific
requirement in that section or in SPEC_V0_1.md.

## Adding a new test

1. Create a file under `src/tests/`.
2. Export a function matching `TestFn`: `(baseUrl: string, cap: CapabilityEntry) => Promise<TestResult[]>`.
3. Register it in `src/runner.ts` under the appropriate conformance level.
4. Include the spec clause your test verifies in the test's `description` field.

## Ground rules

- TypeScript strict mode. No `any` without a comment explaining why.
- Tests must be non-destructive: do not create production data; use sandbox endpoints if available.
- If a test cannot be automated, mark it `status: "warn"` with a human-readable note — never omit it.
- Run `npm test` (vitest) before opening a PR.

## Opening a PR

1. Fork and branch from `main`.
2. Keep commits atomic — one logical change per commit.
3. Reference the STOA.md §19 requirement your test covers in the PR description.
4. CI (vitest) must pass.

## Code of conduct

Be direct, be kind, be specific. Maintainer email: agents@tryvext.com
