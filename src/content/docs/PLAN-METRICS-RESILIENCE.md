# Plan: Metrics Pipeline Resilience

## Problem

HAL-0052 and similar "add tests" tickets fail despite valid test additions because:

1. **Oscillation** — Coverage jumps 35↔36↔37, sometimes 9 or 10, making gate passes non-deterministic.
2. **Rounding** — `testCoverage` is rounded to an integer; 36.4 vs 36.6 both become 36 vs 37, causing apparent regressions.
3. **Baseline sensitivity** — Last entry is baseline; a single bad run (9) poisons the next run.
4. **Non-determinism** — Package order, test order, and glob order can vary across runs.

## Goals

- Deterministic metrics within a given commit.
- Display precision (2 decimals) so small improvements are visible.
- Resilient baseline so one outlier doesn't fail all future runs.
- Clear failure diagnostics when coverage collection fails.

---

## 1. Determinism

### 1.1 Go package order

**File:** `scripts/metrics`

```bash
# Before:
for pkg in $(go list ./cmd/... 2>/dev/null); do

# After:
for pkg in $(go list ./cmd/... 2>/dev/null | sort); do
```

### 1.2 Coverage merge order

`coverage_pkg_*.out` glob order can vary by filesystem. Use sorted inputs:

```bash
# Before:
if ls coverage_pkg_*.out 1>/dev/null 2>&1 && go run github.com/wadey/gocovmerge@latest coverage_pkg_*.out > coverage.out

# After:
coverfiles=$(ls coverage_pkg_*.out 2>/dev/null | sort)
if [[ -n "$coverfiles" ]] && echo "$coverfiles" | xargs go run github.com/wadey/gocovmerge@latest > coverage.out
```

### 1.3 Vitest: thresholds cause exit 1 → coverage summary timing

**Problem:** Vitest enforces coverage thresholds (lines 70%, branches 50%, functions 45%). When thresholds fail, Vitest exits with code 1. This can cause non-deterministic behavior—e.g. exit before coverage-summary.json is fully written, or pnpm/process handling differs on exit 1.

**Fix:** Use a separate `test:coverage:metrics` script that runs Vitest with thresholds set to 0 via CLI. The metrics script calls this instead of `test:coverage`. Vitest always exits 0, always writes the summary.

```json
"test:coverage:metrics": "vitest run --coverage.enabled --coverage.thresholds.lines=0 --coverage.thresholds.branches=0 --coverage.thresholds.functions=0 --coverage.thresholds.statements=0"
```

### 1.4 Vitest test order

**File:** `apps/ui/vitest.config.ts`

Add explicit no-shuffle for CI/agent runs:

```ts
test: {
  environment: "jsdom",
  sequence: { shuffle: false },  // deterministic test order
  // ...
}
```

### 1.5 Go test flags (optional)

Add `-count=1` to disable test cache (avoids cache poisoning across runs):

```bash
go test -count=1 -coverprofile="coverage_pkg_${i}.out" "$pkg"
```

### 1.6 Line counts (find/xargs)

`find` and `xargs` order can vary. Add `sort` where order matters, or rely on `wc -l` tail (order doesn't affect line count sum—already deterministic).

---

## 2. Precision and Display

### 2.1 Store and use raw values

**File:** `scripts/metrics` (Node block)

- Keep `testCoverage` as integer for backward compatibility (UI, API).
- Add `testCoverageRaw` with 2 decimals (e.g. 36.47).
- Add `codeQualityRaw` similarly.

### 2.2 Gate comparison with raw + tolerance

- Compare `testCoverageRaw >= baselineCoverageRaw - 0.5` (tolerance).
- Or: `Math.floor(testCoverageRaw * 10) / 10 >= baselineCoverage - 0.5`.
- Display in console: `coverage=36.47 (raw) / 36 (displayed)`.

### 2.3 coverageDetail precision

Change `toFixed(1)` to `toFixed(2)` for Go/UI percentages in coverageDetail and coverageBreakdown.

---

## 3. Baseline Resilience

### 3.1 Outlier handling

Use **median of last N entries** as baseline instead of last-1 when last is an outlier:

```js
// If last entry drops >10 points from median of prior 5, treat as outlier—don't use as baseline
const recent = data.entries.slice(-6);
const median = recent.slice(0, -1).sort((a,b)=>a-b)[Math.floor(recent.length/2)];
const last = recent[recent.length-1];
const baselineCoverage = (last < median - 10) ? median : (prevEntry?.testCoverage ?? testCoverageMin);
```

Or simpler: **use `max(testCoverageMin, medianOfLast5)`** so we never regress below a stable baseline.

### 3.2 Don't append on catastrophic drop

If new coverage is <20 (suspicious), do not append to history—likely a bad run (tests failed, coverage not collected). Log error and exit 1 without poisoning baseline.

### 3.3 Config: baseline strategy

Add to `metrics-config.json`:

```json
"baselineStrategy": "median5",
"baselineTolerance": 0.5
```

Options: `last`, `median5`, `minOfLast5`.

---

## 4. Failure Diagnostics

### 4.1 Fail fast when coverage collection is broken

If `go test ./cmd/...` produces no coverage.out or empty, and fallback also fails, exit 1 with clear message instead of silently using 0.

### 4.2 Surface per-package failures

When using per-package coverage, log which packages failed `go test` so we can diagnose (e.g. docgen tests failing).

### 4.3 Emit testCoverageRaw in output

Console: `==> metrics OK (coverage=36.47, quality=62.00)` so CI logs show precision.

---

## 5. Implementation Order

1. Determinism (1.1, 1.2, 1.3) — low risk, high impact.
2. Precision (2.1, 2.2, 2.3) — moderate change, improves diagnostics.
3. Baseline resilience (3.1 or 3.2) — prevents outlier poisoning.
4. Failure diagnostics (4.1, 4.2, 4.3) — improve debuggability.

---

## 6. Out of Scope

- Changing `testCoverageMin` / `codeQualityMin` values (separate ramp).
- Excluding specific packages from coverage (would require config).
- Rewriting the composite formula (weights stay as-is).

---

## Implementation (2026-03-08)

All items implemented:

- **Determinism**: `go list ... | sort`, coverage files sorted before merge, `-count=1` on go test, Vitest `sequence: { shuffle: false }`
- **Precision**: `testCoverageRaw`/`codeQualityRaw` stored (2 decimals), `coverageDetail` and `coverageBreakdown` use `toFixed(2)`
- **Baseline**: `baselineStrategy: "median5"`, `baselineTolerance: 0.5` in config; gate uses raw values with tolerance
- **Failure diagnostics**: Go coverage collection fail-fast (exit 1 if no coverage.out), per-package failure log, raw values in console output
- **Catastrophic drop guard**: Do not append if `testCoverage < 20`
- **Vitest thresholds**: `test:coverage:metrics` script with thresholds=0 so Vitest exits 0 and always writes coverage-summary.json; metrics script uses it instead of test:coverage
