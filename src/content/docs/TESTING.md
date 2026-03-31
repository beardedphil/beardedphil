# How to Test Antikythera Engine

## 1. Quick smoke test

**Prereq:** Go, pnpm.

```bash
bash scripts/demo-up
```

Or: `pnpm hal` (Unix) / `pnpm hal:win` (Windows).

When you see **Engine Demo Ready**, open:

- **Kanban UI:** http://127.0.0.1:5174 — create tickets, drag between columns.
- **Events (optional):** http://127.0.0.1:8080/events

Stop: `Ctrl+C` in that terminal.

---

## 2. Full stack with PM chat and LLM

Same as (1). Uses bundled Ollama + NATS. First run may take a few minutes while models are pulled.

**Start:** `pnpm hal` (Unix) / `pnpm hal:win` (Windows) or `bash scripts/start.sh`.

When up:

- **Kanban UI:** http://127.0.0.1:5174
- **PM chat:** click the **chat icon** (bottom-right) → talk to the PM; use fullscreen if you want.
- **Ollama** is bundled; first run may take a few minutes while models are pulled; after that, chat is ready.

Stop: `Ctrl+C` in the terminal.

---

## 3. Local (Go + Node) — Kanban + Kernel only

**Prereq:** Go, pnpm, NATS (use bundled: `scripts/ensure-bundled.sh` or run `pnpm hal:backend` for NATS).

```bash
# Terminal 1: NATS (or use bundled: . scripts/ensure-bundled.sh && $NATS_BIN -js -p 4222)
nats-server

# Terminal 2: Kernel
go run ./cmd/kernel
# HTTP on :8080

# Terminal 3: Kanban
go run ./cmd/kanban
# Uses NATS

# Terminal 4: UI
pnpm --dir apps/ui dev
# Open http://127.0.0.1:5174
```

Use the board at http://127.0.0.1:5174. The UI sends commands to the kernel at 8080.

---

## 4. Local with PM chat and context

Same as (3), plus:

```bash
# Terminal 5: Context (auto-indexes specs/docs for PM)
go run ./cmd/context
# :8092

# Terminal 6: PM (chat + create-card)
go run ./cmd/pm
# :8093

# Terminal 7 (optional): LLM gateway → needs Ollama on host
ollama pull llama3
ollama serve
go run ./cmd/llm
# :8096
```

Then open http://127.0.0.1:5174 and use the **chat icon** (bottom-right). PM chat uses Context for retrieval and indexes turns + summaries.

---

## 5. E2E tests

**Standalone (starts its own NATS, Kernel, Kanban, UI):**

```bash
bash scripts/check-e2e
```

Runs bundled NATS, Kernel, Kanban, UI, then Playwright. Artifacts under `~/.hal/runs/<runId>/`.

**Against running stack:**

```bash
# Terminal 1: start the engine
pnpm hal   # or pnpm hal:win

# Terminal 2: run E2E
bash scripts/demo-e2e
```

---

## 6. Test coverage and code quality metrics

The UI shows **Test Coverage** and **Code Quality** badges in the bottom-left corner. Hover over either to see an explanation.

### Computing metrics

To refresh metrics manually:

```bash
pnpm hal:metrics
# or
bash scripts/metrics
```

This runs:

- Go unit tests with coverage across the module (`go test -coverprofile ./...` — all `cmd/`, `internal/`, `pkg/`). Set `HAL_METRICS_GO_LIST=./cmd/...` only if you need the legacy narrow scope.
- UI unit tests with coverage (`pnpm --dir apps/ui test:coverage`)
- Go linter (`golangci-lint` on `./cmd/...`, `./internal/...`, `./pkg/...` when present — errcheck, govet, gocognit, staticcheck)
- UI linter (`eslint src`)

To run Go lint locally (not just in CI/metrics):

```bash
pnpm golangci-lint
```

On Windows with Go 1.26+, if `go run` fails, install the binary first:

```powershell
pnpm golangci-lint:install
```

Add `%USERPROFILE%\go\bin` to PATH, then `pnpm golangci-lint` will use the binary.

Output: `metrics.json` at repo root. The kernel serves it at `GET /api/metrics` for the UI.

### After QA merge (instant sync)

`metrics.json` is committed to the repo by the Implementation agent. When QA merges the feature branch to `main`, it calls **`POST /api/metrics/sync`** on the kernel, which reloads the committed `metrics.json` from disk into the DB. The UI picks up the numbers on the next poll (~5s) with no spinner and no background recomputation.

Set **`HAL_KERNEL_URL`** (e.g. `http://127.0.0.1:8080`) on the QA process if the kernel is not on the default host/port. If the kernel is down, the sync call is a best-effort no-op.

**How metrics stay fresh:** The Implementation agent computes metrics during `runCoverageGateForCoverageTasks` (coverage tasks) and includes `metrics.json` in its commits. The Husky post-commit hook runs `scripts/metrics-incremental` in the background after every commit, so the next implementation commit picks up those updated numbers.

**Pre-commit uses `scripts/check-fast`**, which runs targeted Go tests for changed packages **in parallel** (cap 4; set `HAL_CHECK_GO_TEST_PARALLEL` to change).

**Pre-push vs pre-commit:** `pre-push` runs `HAL_CHECK_FAST_SCOPE=push scripts/check-fast`, which **skips `go mod tidy`** and keys checks to files in **outgoing commits** (`merge-base origin/main..HEAD`), not the working tree—so push stays fast after a successful commit.

### Minimum thresholds

Configured in `scripts/metrics-config.json`:

- `testCoverageMin`: minimum coverage (0–100), currently 35 (ramp toward 70)
- `codeQualityMin`: minimum quality score (0–100), currently 28 (ramp toward 70)

Vitest enforces UI coverage thresholds: lines 70%, branches 50%, functions 45%. CI runs a Go coverage gate (15% minimum).

Test coverage uses weighted line/branch/function across Go and UI. Goal: both above 70 eventually.

`scripts/check` runs `scripts/metrics` and fails if either metric is below its minimum.

### Ramp-up plan

Minimums start low and increase over time. Adjust `scripts/metrics-config.json` periodically (e.g. +5 coverage per quarter until 80%).

### Pre-commit hook

Husky runs `bash scripts/check` on each commit. Install dependencies first:

```bash
pnpm install
```

**Important:** Never use `--no-verify` or bypass the pre-commit hook. Always add tests and fix lint errors so checks pass (see rulebook/rules/TEST-CHECK-001).

**How the badges get fresh numbers:**

- **On every commit:** Pre-commit runs `scripts/check`, which runs `scripts/metrics` and writes `metrics.json` in the repo root. The kernel reads `metrics.json` from `HAL_PROJECT_ROOT` (set by `pnpm hal:backend` / `hal:win`). On each GET /api/metrics the kernel reloads from file if it changed, so the UI picks up new numbers within a few seconds (MetricsBadge polls every 5s and refetches when you return to the tab).
- **Periodically:** If `scripts/metrics-config.json` has `metricsRefreshIntervalMinutes` (e.g. 15), the kernel runs the metrics script on that interval so the badges update even without a commit. Override with `HAL_METRICS_REFRESH_INTERVAL_MINUTES` or set to 0 to disable.
- **When pre-commit is skipped** (e.g. `--no-verify`): run `pnpm hal:metrics` manually to refresh `metrics.json`.

---

## 7. Health checks

With services running:

```bash
curl http://127.0.0.1:8080/health   # Kernel (if exposed)
curl http://127.0.0.1:8091/health   # QA
curl http://127.0.0.1:8092/health   # Context
curl http://127.0.0.1:8093/health   # PM
curl http://127.0.0.1:8094/health   # Implementation
curl http://127.0.0.1:8095/health   # Process Review
    curl http://127.0.0.1:11434/health   # Ollama HTTP API
```

---

## 8. Summary

| What you want              | Command / steps |
|----------------------------|-----------------|
| Full stack                 | `pnpm hal` (Unix) / `pnpm hal:win` (Windows) → http://127.0.0.1:5174 |
| E2E standalone             | `bash scripts/check-e2e` |
| E2E vs running stack       | `pnpm hal` in one terminal, `bash scripts/demo-e2e` in another |
