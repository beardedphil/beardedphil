# Local setup

No manual steps beyond installing prerequisites. After that: `bash scripts/bootstrap` → `bash scripts/check` → `bash scripts/check-e2e`.

## Prerequisites (single-step)

Install these once; then use the commands below. If a script fails, it will print one actionable message.

- **Node 18+** — [nodejs.org](https://nodejs.org/) or your package manager. Verify: `node -v`
- **pnpm** — `npm install -g pnpm`. Verify: `pnpm -v`
- **Go** — [go.dev/dl](https://go.dev/dl/) or `winget install GoLang.Go` (Windows). Ensure `go` is in PATH. Verify: `go version`

## One-command path

From the repo root:

```bash
# One-time (or when deps change): install deps + Playwright browsers. Safe to re-run.
bash scripts/bootstrap

# Verify: contracts, kernel, kanban, UI unit tests and builds.
bash scripts/check

# E2E: bundled NATS, Kernel, Kanban, UI, Playwright. Artifacts under ~/.hal/runs/<runId>/
bash scripts/check-e2e
```

No other manual steps. If `go` is not in PATH, the scripts will fail with a clear message and point to this doc.

## Windows

- Go: `winget install GoLang.Go` — add `C:\Program Files\Go\bin` to PATH if needed.

---

## Local Dev (hand-off laptop)

For **everything from the UI** — native workspace picker, real code changes — run the engine with services on the host:

**Requirements:** Go, pnpm. Uses bundled Ollama and NATS (same paths as the installable: `~/.hal/ollama` and `~/.hal/nats`); downloads on first run if missing.

**One command to start everything:**

```bash
# Windows
pnpm hal:win

# Unix/macOS
pnpm hal
```

Or backend only (for Tauri dev): `pnpm hal:backend:win` (Windows) / `pnpm hal:backend` (Unix).

This starts Ollama, NATS, the LLM gateway, kernel, kanban, implementation, QA, PM, Context, and UI. The browser opens automatically.

**First run:** Connect workspace via **Browse** in the modal. The native directory picker opens; select your project. Implementation will modify files in that workspace when you move tickets to Ready to Do.

**Linux:** Install `zenity` (e.g. `apt install zenity`) or `kdialog` for the Browse picker.

---

## GPU vs CPU

All models (chat and embedding) run on the GPU by default. Ollama handles VRAM overflow: when models don't fit in GPU memory, it automatically uses CPU/RAM instead. The engine does not need to configure separate CPU instances.

**Optional:** `HAL_EMBED_OLLAMA_URL` points to a separate Ollama instance (e.g. CPU-only on port 11435) if you explicitly want to offload embedding to avoid contention. Unset = both chat and embedding use the main GPU instance.
