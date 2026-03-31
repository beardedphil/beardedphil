# Project Handbook

This handbook is generated automatically by the docgen pipeline.

## Table of Contents
- [Executive Overview](#handbook:ch1)
- [Appendix A: Architecture & Services](#handbook:appendix-a)
- [Appendix B: Model System](#handbook:appendix-b)
- [Appendix C: Agent Lifecycle](#handbook:appendix-c)
- [Appendix D: Frontend & UI](#handbook:appendix-d)
- [Appendix E: Configuration & Deployment](#handbook:appendix-e)
- [Appendix F: Rulebook & Governance](#handbook:appendix-f)
- [Appendix G: API Reference](#handbook:appendix-g)

---

# Executive Overview {#handbook:ch1}

This handbook describes HAL — an integrated suite that uses orchestration, retrieval, and controlled agent workflows to help product, QA, and engineering teams turn ideas into verified work with traceability and governance. This chapter gives a concise, non‑technical summary of what HAL delivers, why it matters, and how the pieces fit together at a high level. For technical details and operational instructions see the appendices listed throughout.

## Purpose and business value {#handbook:ch1}

HAL reduces handoffs, speeds up discovery and implementation, and raises confidence in changes by combining human workflows with automated agents and verification processes. Key business outcomes include:

- Faster ticket production: PMs can convert specifications and conversations into structured, actionable tickets using PM chat and automated Kanban creation.
- Controlled automation of implementation: Tool‑enabled agents can produce small, auditable code changes or guidance, reducing routine work while preserving human review.
- Continuous verification: Built‑in QA and process review pipelines exercise changes and generate evidence before code is merged or shipped.
- Traceability and incident readiness: Every automated run produces artifacts (plans, logs, failure bundles) with runId/correlationId so teams can inspect what happened and why.
- Governance and safety: System rules and budgets prevent runaway automation, enforce verification, and ensure offline/privileged modes when required.

For the governance rules and operational constraints that underpin these outcomes, see [Appendix F](#handbook:appendix-f).

## Primary system capabilities {#handbook:ch1}

- PM chat and ticket creation — conversational interface that retrieves contextual documents and generates Kanban tickets or updates (PM service).
- Contextual search & embeddings — automatic indexing of specs and docs so agents and PM chat have fast access to relevant context (Context service).
- Tool‑enabled implementation — implementation agents use approved tool gateways to read, edit, run tests, and produce patch‑only outputs with clear plans and evidence.
- Orchestration & event triggers — a lightweight orchestrator listens for board events (e.g., card moved) and triggers QA, process review, or other flows.
- Automated QA and process review — end‑to‑end verification runs (including Playwright E2E where applicable) and policy checks before changes progress.
- Model management — pluggable model gateway for on‑prem or hosted models, with controls for context budgets and offline guarantees.
- Observability & forensics — every run outputs a structured artifact set; CLI tools let you inspect runs and tickets for failures and conversations.

See detailed capabilities and service entry points in [Appendix A](#handbook:appendix-a) and the Model System in [Appendix B](#handbook:appendix-b).

## Who benefits (personas) {#handbook:ch1}

- Product Managers: faster, more consistent ticket creation and richer context in conversations.
- Engineering/Product Implementation Leads: automated help with small edits and reproducible implementation plans.
- QA Engineers: automated, repeatable checks and clear artifacts for failures.
- Engineering Managers and Compliance: enforceable guardrails, auditability, and measurable outcomes.

## High‑level architecture {#handbook:ch1}

HAL is built as a set of focused services that communicate over a lightweight message bus and simple HTTP endpoints. The architecture emphasizes separation of concerns, observability, and deployability in local or hosted environments.

- Message bus (NATS): the central event fabric for triggers and notifications. Orchestrator and many services subscribe to events instead of tight coupling.
- Service set: PM, Context, Implementation, QA, Process Review, Orchestrator, and supporting services. Each exposes a lightweight HTTP UI for verification and HTTP health checks.
- Model gateway: isolates model hosting and policy enforcement; can point at a local Ollama instance or an OpenAI‑compatible API.
- Storage of artifacts: runs, tickets, and transcripts are written to structured directories so every automated action produces inspectable evidence (plans, logs, failure bundles).
- Frontend: a web UI and an optional desktop client provide Kanban, card detail, and chat experiences that connect to the same services.

This separation ensures individual services remain small and easy to reason about. For a visual and more detailed breakdown of services and interactions, see [Appendix A](#handbook:appendix-a). The front‑end and UI components are documented in [Appendix D](#handbook:appendix-d).

## Typical flows (examples) {#handbook:ch1}

- PM chat → ticket creation: A PM asks the system to create a ticket; Context provides relevant specs, the PM service drafts a ticket, and Kanban records the card. The resulting run artifacts and the ticket record are stored for inspection.
- Card moved → orchestrated checks: Moving a card to a column triggers the Orchestrator. It may start QA or Process Review runs and report back status updates to the ticket.
- Implementation run → plan & patch: The Implementation agent produces a plan, applies patch‑only edits (per governance), runs verification steps, and writes a run folder that includes plan.md, worklog, and any failure bundles.
- Failure → inspect & iterate: If a run fails, a failure artifact includes a correlationId. Teams use CLI tools to fetch run and ticket artifacts for diagnosis.

For agent behavior, lifecycle, and turn budgets (how long agents may run and when they must fail), see [Appendix C](#handbook:appendix-c).

## Governance, safety, and traceability {#handbook:ch1}

Governance is a first‑class concern:

- Rulebook & Constitution: The system enforces guardrails like "plan then patch," patch‑only edits, context budget awareness, and the requirement for verification evidence. See the full rule set in [Appendix F](#handbook:appendix-f).
- Turn budgets & convergence constraints: Agents have finite budgets and must converge or fail with evidence (prevents infinite retries).
- Offline guarantees: When offline mode is enabled, no outbound network calls are permitted — essential for sensitive work.
- Observability: Each action is tagged with runId + correlationId; runs write a documented set of artifacts that support audits and post‑mortems.

These controls balance automation speed with organizational risk management.

## Operational notes {#handbook:ch1}

- Local development and quick starts: A single command can start the full stack (including bundled NATS and optional Ollama) for local evaluation. Services expose simple HTTP health endpoints for monitoring.
- Deployment & configuration: Services accept environment variables and have a consistent layout for data roots and run artifacts. See deployment patterns, environment variables, and operational scripts in [Appendix E](#handbook:appendix-e).
- APIs and integration: Services provide lightweight HTTP APIs and some CLI utilities to inspect tickets and runs. The full API reference, including health endpoints and payload expectations, is in [Appendix G](#handbook:appendix-g).

## Where to learn more {#handbook:ch1}

- Architecture and how services interact: [Appendix A](#handbook:appendix-a)
- Model selection, embeddings, and prompt/context policies: [Appendix B](#handbook:appendix-b)
- Agent lifecycle, turn budgets, and run artifacts: [Appendix C](#handbook:appendix-c)
- Frontend flows, user experience, and desktop app notes: [Appendix D](#handbook:appendix-d)
- Configuration, environment variables, and deployment recipes: [Appendix E](#handbook:appendix-e)
- Rulebook, constitution, and governance controls: [Appendix F](#handbook:appendix-f)
- Service APIs, health checks, and CLI tools: [Appendix G](#handbook:appendix-g)

## Final notes {#handbook:ch1}

HAL is designed to accelerate delivery while ensuring changes are planned, verifiable, and auditable. The product is intentionally modular: teams can adopt the full stack or integrate parts that match their existing processes (PM chat, context retrieval, or verification pipelines). The appendices provide the technical and operational detail you’ll need to onboard teams, configure deployments, and maintain governance as automation is introduced into the workflow.

---

# Appendix A: Architecture & Services {#handbook:appendix-a}

Table of contents
- Service boundary overview
- Transport layer (HTTP + CORS + SSE)
- LLM Gateway integration and proxying
- Metrics subsystem (refresher, DB sync, auto-ticketing)
- Run artifacts & diff inspection
- LLM watch persistence
- Hardware & project detection
- Concurrency, locking and failure modes
- Environment configuration and file layout
- Key file references and call graph / workflows
- Operational notes, scaling and security considerations

---

## Service boundary overview {#handbook:appendix-a}

High-level services and their responsibilities:

- Kernel (cmd/kernel)
  - Exposes HTTP API used by UI (web and desktop), local CLIs, and other components.
  - Routes: health, command, events (SSE), settings proxy, workspace, board, metrics, LLM-related endpoints, transcripts, runs/compare-diffs, hardware/project detection, and PM backend proxy.
  - Composes application-layer components in `app` and persistence in `storage`.

  Relevant code: `cmd/kernel/transport/*.go` (multiple files). Main entry point for HTTP wiring: `cmd/kernel/transport/http.go`.

- LLM Gateway (external process)
  - Kernel proxies to a configured LLM gateway for model management, streaming responses, and settings.
  - Integration via HTTP proxy handled in `settingsProxyHandler()` and `llmProxyHandler()` (see `cmd/kernel/transport/kernel_http_handlers.go`).

- Context service (external process)
  - Kernel checks context status endpoint (`/api/status`) to ensure context readiness for features such as LLM readiness.

- Metrics service (scripts + SQLite)
  - Local metrics collection scripts under `scripts/` (project-level) produce `metrics.json`.
  - Kernel periodically runs those scripts (via `metricsRefresher`) and syncs `metrics.json` into a SQLite-backed `MetricsStore` (see `cmd/kernel/storage`).

- Transcripts storage
  - Persistence for LLM watches and transcripts used by `/api/llm-watches` (see `cmd/transcripts/storage`).

- Event forwarding (SSE)
  - Kernel publishes application events and serves them over SSE to UIs using an `app.EventForwarder` (see `eventsHandlerFunc` in `kernel_http_handlers.go`).

- Messaging (NATS)
  - Kernel publishes NATS messages for certain automated flows (e.g., stale coverage tickets).
  - NATS connection passed into `NewHandler(..., nc *nats.Conn)` and used in `metricsRefresher.createStaleCoverageTicket()` to publish `cmd.Kanban.CreateCard.v1`.

- UI (apps/ui and apps/hal-desktop)
  - Frontend communicates via HTTP to kernel endpoints.
  - Desktop app (Tauri) also contains `src-tauri/src/nats.rs` and `hal.rs` (possible direct NATS or system calls) — integration points for platform features.

---

## Transport layer (HTTP + CORS + SSE) {#handbook:appendix-a}

Primary HTTP wiring and CORS:

- File: `cmd/kernel/transport/http.go`
  - `NewHandler(...)` constructs a `Handler` struct with all HTTP handler functions wired.
  - `Handler.Mux()` registers routes and wraps the mux with `corsHandler()`.

- CORS behavior:
  - Allowed origins enumerated in `allowedOrigins` map inside `http.go` (ports 5173/5174).
  - `corsHandler()` sets `Access-Control-Allow-Origin` for allowed requests, allows `GET, POST, OPTIONS`, and short-circuits `OPTIONS` with `204 No Content`.

Event streaming (Server-Sent Events):

- `eventsHandlerFunc(forwarder *app.EventForwarder)` returns an HTTP handler that on GET calls `ServeSSE(forwarder, w, r)`.
  - ServeSSE bridges `app.EventForwarder` to SSE clients. (Implementation likely in this package; not shown in provided snippets.)
  - SSE stream used by UI to receive live application events, updates and progress.

Request body handling:

- `readBody(r *http.Request) []byte` (`kernel_http_handlers.go`)
  - Protects against very large payloads: rejects bodies with `Content-Length > 256 KiB`.
  - Reads up to `maxBody` (256 KiB) into memory; returns `nil` on over-limit or read error.
  - Used by `commandHandlerFunc()` to forward POSTed command payloads to `app.CommandHandler.Handle()`.

Logging:

- Logging passes through `storage.Logger` (construction: `storage.NewLogger(nil)` in tests) and `Handler` uses it for command acceptance/rejection:

  - `commandHandlerFunc()` calls `ch.Handle(body)` and logs either `log.Error("command rejected", ...)` or `log.Info("command accepted", ...)`.

HTTP endpoints (important subset):

- `/health` — `healthHandler()` (`kernel_http_handlers.go`)
- `/api/command` — `commandHandlerFunc()` to dispatch commands into `app.CommandHandler`.
- `/events` — SSE stream for events (`eventsHandlerFunc()`).
- `/api/settings` — `settingsProxyHandler(...)` proxies to LLM gateway or returns default.
- `/api/metrics`, `/api/metrics/refresh`, `/api/metrics/sync` — metrics endpoints (`kernel_http_metrics.go`).
- `/api/llm-ready`, `/api/llm-*` — LLM gateway probes and proxies.
- `/api/llm-watches` — GET watches for a card (persistent store).
- `/api/compare-diffs` — read run diffs for a card (filesystem).
- `/api/hardware-detect` — hardware detection (`internal/hwdetect`) and defaults.
- `/models-catalog.json` — static catalog file from `rulebook/`.

Method validation is enforced in most handlers (e.g., `if r.Method != http.MethodGet { ... }`), returning `405 Method Not Allowed` where appropriate.

---

## LLM Gateway integration and proxying {#handbook:appendix-a}

Handlers:

- `settingsProxyHandler(base string)` (`cmd/kernel/transport/kernel_http_handlers.go`)
  - If `base` is empty, serves default settings: `{"mode":"free","providers":[]}`.
  - Forwards GET / POST to `<base>/api/settings`.
  - Redacts `apiKey` using `redactSettingsBody()` before logging.
  - Timeout: 3s client deadlines.
  - On GET failure returns `503 llm gateway unavailable`; on POST network error returns `502 failed to persist settings`.

- `llmProxyHandler(base string, path string, stream bool)` (`kernel_http_handlers.go`)
  - General-purpose proxy to LLM gateway for endpoints under `path`.
  - Invoked with `stream` true for long-poll or streaming endpoints (e.g., `/api/pull`).
  - Behavior:
    - Copies request body (if POST) and forwards with `Content-Type: application/json`.
    - Client timeout: `45 minutes` (to support long-running streaming).
    - If `stream==true`, kernel sets response headers for streaming:
      - Sets `Content-Type` to `application/x-ndjson` if upstream has no Content-Type.
      - Sets `Cache-Control: no-cache`, `Connection: keep-alive`.
      - Copies response body in a manual read loop using a 32KiB buffer; flushes via `http.Flusher` to ensure data reaches the client incrementally.
    - On network errors, returns `502 Bad Gateway` with logged error.

- `llmReadyHandler(llmGatewayURL, contextURL)` (`kernel_http_handlers.go`)
  - Endpoint: `/api/llm-ready` — aggregates LLM gateway reachability and context readiness.
  - Checks:
    - LLM gateway responds 200 OK at `<llmGatewayURL>/health` (timeout 3s) => `llmReady`.
    - Context readiness via `<contextURL>/api/status` returns JSON { ready, indexing } => `contextReady` and `contextIndexing`.
  - Returns JSON:
    - `"ready": llmReady && contextReady`, along with both substatuses.
  - Intent: "ready" means both LLM gateway is reachable and context indexing is OK (cold-start model loads allowed).

Design notes:
- Separation of concerns: kernel delegates LLM heavy lifting to gateway, acting as a thin proxy and readiness aggregator.
- Streaming preserves chunked delivery for interactive models (NDJSON) by manual copy + flush.

---

## Metrics subsystem (refresher, DB sync, auto-ticketing) {#handbook:appendix-a}

Core components:

- `metricsRefresher` struct (`cmd/kernel/transport/kernel_http_metrics.go`)
  - Fields:
    - `store *storage.MetricsStore` — optional DB-backed metrics store (SQLite).
    - `nc *nats.Conn` — optional NATS connection for automated ticket creation.
    - `filePath string` — path to `metrics.json`, default `HAL_PROJECT_ROOT/metrics.json` or overridden by `HAL_METRICS_FILE`.
    - `interval` — refresh interval from environment or `scripts/metrics-config.json`.
    - Locks: `mu` and `dbSyncMu`.
      - `mu` guards `running`, `tickCount`, and disk snapshot metadata.
      - `dbSyncMu` serializes DB ReplaceFromJSON vs List operations to avoid torn reads.

- Initialization:
  - `newMetricsRefresher(store, nc)` reads `scripts/metrics-config.json` (project root `HAL_PROJECT_ROOT`), overrides via `HAL_METRICS_REFRESH_INTERVAL_SECONDS` / `_MINUTES`, configures `filePath`.

- Running scripts:
  - `runScriptMode(forceFullRun bool)` chooses `scripts/metrics-incremental` when available and `forceFullRun` false, otherwise `scripts/metrics`.
  - Uses `metricsBashExecutable()` to locate `bash`:
    - Respects `HAL_BASH` env var.
    - Fallbacks: `exec.LookPath("bash")`, then common Windows Git bash paths.
    - If not found logs and aborts refresh.
  - Runs script with `METRICS_SKIP_GATE=1` env var set.
  - After script completes, reads `metrics.json` and calls `store.ReplaceFromJSON()` while holding `dbSyncMu` to sync DB.

- Periodic scheduling:
  - `start()` orchestrates:
    - A delayed full-run (3s).
    - Ticker per configured interval.
    - `tickCount` increments and every `fullRunEveryN` ticks a forced full run occurs (default N=6).
  - If `interval <= 0` logs disabled and does not start.

- Disk snapshot tracking:
  - `recordDiskSnapshotAfterSync()` stores last disk modtime/size so future GET /api/metrics can avoid unnecessary reloads.

HTTP endpoints for metrics:

- `metricsHandler(store, refresher, workspaceStore)` — GET `/api/metrics`
  - If `workspaceStore` provided compares workspace path to `HAL_PROJECT_ROOT` (via `normPath`) to prevent showing metrics for different workspace (returns `{"entries":[],"metricsForWorkspace":false}`).
  - If `refresher != nil`, locks `dbSyncMu` and calls `refresher.syncFromFileIfDiskChangedLocked()` to ensure DB is in sync before `List`.
  - Prefer DB:
    - If `store.List(ctx, 100)` returns non-empty entries, returns DB JSON with `metricsForWorkspace: true`.
  - Fallback file path search: `HAL_METRICS_FILE`, else `HAL_PROJECT_ROOT` or current working dir then `metrics.json`.
  - Error handling:
    - If file missing -> `404 Not Found`.
    - If invalid JSON -> `500 invalid metrics.json`.
  - Response header: `Cache-Control: no-store`.

- `metricsRefreshHandler(refresher)` — POST `/api/metrics/refresh`
  - Launches `refresher.runScript()` asynchronously, returns `202 Accepted` and JSON `{"status":"computing"}`.

- `metricsSyncHandler(refresher)` — POST `/api/metrics/sync`
  - Synchronously runs `refresher.syncFromFile()` and returns `{"status":"synced"}` or `404` if no metrics file / sync failed.

Auto-ticket creation (stale coverage):

- After each successful script run, `checkStaleAndCreateTickets()` inspects `cache_meta.json` (path: `HAL_METRICS_CACHE_DIR` or default `${root}/.hal/metrics-cache/coverage/cache_meta.json`).
- For packages with `Failures` >= `threshold` (default 5 or `HAL_COVERAGE_STALE_THRESHOLD`), creates a Kanban card via NATS:
  - Message envelope published to topic `cmd.Kanban.CreateCard.v1`.
  - Envelope contains:
    - `name`, `version`, `runId` (prefixed `run_kernel_stale_` + nuid), and `payload` containing `title`, `description` and optional `workspacePath`.
- Deduplication: sets `TicketCreated` flag in `cache_meta.json` on success and persists file.

Locks and synchronization:

- `runScriptMode()` holds `m.mu` to set `running` flag. `defer` ensures cleared.
- DB sync operations (`ReplaceFromJSON`, `List`) both synchronize via `dbSyncMu` to ensure consistent reads.
- GET `/api/metrics` acquires `dbSyncMu` around `List` and calls `syncFromFileIfDiskChangedLocked()` while holding it, preventing torn reads.

Env-driven file paths / overrides:

- `HAL_PROJECT_ROOT` — project root directory.
- `HAL_METRICS_FILE` — explicit path to metrics.json.
- `HAL_METRICS_DB` — path to metrics DB (used by `storage.NewMetricsStore()`).
- `HAL_METRICS_REFRESH_INTERVAL_SECONDS` / `_MINUTES` — override refresh schedule.
- `HAL_METRICS_CACHE_DIR` — location of metrics cache and `cache_meta.json`.
- `HAL_BASH` — explicit bash executable path.

References:
- `cmd/kernel/transport/kernel_http_metrics.go`
- Tests: `cmd/kernel/transport/kernel_http_metrics_test.go`
- Storage: `cmd/kernel/storage` (methods referenced: `NewMetricsStore()`, `MetricsStore.ReplaceFromJSON`, `MetricsStore.List`).

---

## Run artifacts & compare-diffs {#handbook:appendix-a}

Purpose: allow inspection of outputs from recent runs (orchestrator or implementation runs).

Handler:

- `compareDiffsHandler()` (`cmd/kernel/transport/kernel_http_compare_diffs.go`)
  - GET `/api/compare-diffs?cardId=X`
  - Searches runs directory:
    - Default runs root: `${HOME}/.hal/runs`
    - Override: `HAL_RUNS_ROOT`.
  - `findMostRecentRunForCard(runsRoot, cardID)`:
    - Scans `runsRoot` for directories starting with `run_orch_` or `run_impl_`.
    - Reads `plan.md` inside each run; if the `cardId` exists in the plan content, include run.
    - Sort by `mtime` of `plan.md` descending and return the most recent run id.
  - If runID found:
    - Reads files: `cursor-diff.txt`, `qwen-diff.txt`, `gpt-diff.txt` inside run dir and returns them as `cursor`, `qwen`, `gpt`.
  - Returns JSON with fields `runId`, `cursor`, `qwen`, `gpt`.
  - If no run found returns JSON with empty diffs.

Failure modes:
- Directory missing or no matching runs => returns JSON with empty strings.
- Reads are best-effort: `readFile` returns empty string on read error.

References:
- `cmd/kernel/transport/kernel_http_compare_diffs.go`
- Tests: placeholder `kernel_http_compare_diffs_test.go`.

---

## LLM watch persistence {#handbook:appendix-a}

Handler:

- `llmWatchesHandler()` (`cmd/kernel/transport/kernel_http_llm_watches.go`)
  - GET `/api/llm-watches?cardId=X`
  - Uses `storage.NewStore()` from `cmd/transcripts/storage` to read persisted watch modal content for a ticket.
  - Validates `cardId` parameter; returns `400` if missing.
  - Converts stored items to JSON array of watches with fields:
    - `cardId`, `runId`, `correlationId`, `agentType`, `phase`, `activeModel`, `prompt`, `models`, `contentByModel`, `reasoningByModel`, `resultByModel`, `modTime`.
  - Returns `{"watches": [...]}`.

Notes:
- This endpoint is read-only in kernel; writes likely occur from agents or other parts of the system into `cmd/transcripts/storage`.

References:
- `cmd/kernel/transport/kernel_http_llm_watches.go`
- Store: `cmd/transcripts/storage` (not expanded in provided context).

---

## Hardware & project detection {#handbook:appendix-a}

Handlers:

- `hardwareDetectHandler()` (`cmd/kernel/transport/kernel_http_hwdetect.go`)
  - Accepts GET and POST.
  - Calls `hwdetect.DetectAndCache()` (module: `internal/hwdetect`) to obtain hardware characteristics (VRAM, SystemRAM, UnifiedMemory).
  - Computes `UsableMemoryGB` when discrete GPU exists using VRAM + system RAM.
  - Classifies tier via `hwdetect.ClassifyTier(...)` and returns defaults via `hwdetect.DefaultsForTier(...)`.
  - Returns JSON containing `hardware` and `defaults`.

- `projectDetectHandler(workspaceGetter func() string)` (`kernel_http_hwdetect.go`)
  - GET `/api/project-detect`
  - Calls `projectdetect.Detect(ws)` using workspace path (provided via `workspaceStore.Get().Path` in `NewHandler`).
  - Returns JSON `{"projects": [...]}`.

- `modelsCatalogHandler()` (`kernel_http_hwdetect.go`)
  - Serves `rulebook/models-catalog.json` at `/models-catalog.json`.
  - Reads from `HAL_PROJECT_ROOT` or current working directory.

References:
- `cmd/kernel/transport/kernel_http_hwdetect.go`
- `internal/hwdetect` and `internal/projectdetect`.

---

## Concurrency, locking and failure modes {#handbook:appendix-a}

Concurrency control summary:

- metricsRefresher:
  - `mu` controls `running` and ticks; prevents concurrent runs of metrics scripts.
  - `dbSyncMu` serializes DB `ReplaceFromJSON` and `List` in GET `/api/metrics` to avoid partial reads.
  - Snapshot state `diskSnapValid`, `lastDiskModTime`, `lastDiskSize` guarded under `mu`.

- HTTP handlers:
  - Stateless per-request except when interacting with `metricsRefresher` and `MetricsStore` (see db sync mutex).
  - `commandHandlerFunc` delegates to `app.CommandHandler.Handle()` synchronously and logs latencies. If `app.CommandHandler` is nil (e.g., tests), the `/api/board` route returns `500` as tested.

Failure modes & timeouts:

- LLM proxy calls: `client.Timeout = 45 * time.Minute` to allow long-running streaming; upstream errors return `502`.
- Settings proxy: `client.Timeout = 3 * time.Second`. If gateway unreachable:
  - GET -> `503 llm gateway unavailable`
  - POST -> `502 failed to persist settings`
- Metrics script execution:
  - If bash not found -> refresh skipped, logged.
  - If script fails -> logged, refresh returns false.
- File reads:
  - Missing `metrics.json` -> GET `/api/metrics` returns `404`.
  - Invalid JSON -> `500 invalid metrics.json`.
- CORS preflight: allowed origins only; `OPTIONS` returns `204`.

---

## Environment configuration and file layout {#handbook:appendix-a}

Significant environment variables and default behaviors:

- HAL_PROJECT_ROOT
  - Default: current working directory (if not set).
  - Used for: locating `metrics.json`, `rulebook/models-catalog.json`, `scripts/`, and default workspace context.

- HAL_METRICS_FILE
  - Path to `metrics.json` file (overrides project root path).

- HAL_METRICS_DB
  - Path to SQLite DB for metrics (used by `storage.NewMetricsStore()`).

- HAL_RUNS_ROOT
  - Overrides runs directory (`~/.hal/runs`) used by compare-diffs.

- HAL_METRICS_REFRESH_INTERVAL_SECONDS / _MINUTES
  - Scheduling overrides for metrics refresher.

- HAL_METRICS_CACHE_DIR
  - Location for metrics cache and `cache_meta.json` used by stale coverage ticketing.

- HAL_COVERAGE_STALE_THRESHOLD
  - Number of consecutive failures before creating ticket (default 5).

- HAL_BASH
  - Path to bash executable to run metric scripts.

Filesystem layout (relevant places):

- Home-based run artifacts: `${HOME}/.hal/runs/<runid>/` containing:
  - `plan.md` (used to match run to cardId).
  - `cursor-diff.txt`, `qwen-diff.txt`, `gpt-diff.txt` — diffs returned by `compareDiffsHandler`.

- Project files:
  - `scripts/metrics` and `scripts/metrics-incremental` — shell scripts executed by metrics refresher.
  - `rulebook/models-catalog.json` — models catalog served by `modelsCatalogHandler()`.

- Kernel local state:
  - Metrics DB: default `~/.hal/kernel/metrics.db` or configurable via `HAL_METRICS_DB`.

---

## Key file references and code map {#handbook:appendix-a}

Transport & HTTP handlers
- cmd/kernel/transport/http.go
  - NewHandler(...)
  - Handler.Mux()
  - CORS handling and route registration
- cmd/kernel/transport/kernel_http_handlers.go
  - settingsProxyHandler
  - llmProxyHandler
  - llmReadyHandler
  - healthHandler
  - commandHandlerFunc
  - eventsHandlerFunc
  - readBody
- cmd/kernel/transport/kernel_http_metrics.go
  - metricsRefresher, newMetricsRefresher, start, runScriptMode
  - metricsHandler, metricsRefreshHandler, metricsSyncHandler
  - stale coverage ticket creation (createStaleCoverageTicket)
- cmd/kernel/transport/kernel_http_llm_watches.go
  - llmWatchesHandler
- cmd/kernel/transport/kernel_http_compare_diffs.go
  - compareDiffsHandler, findAllRunsForCard
- cmd/kernel/transport/kernel_http_hwdetect.go
  - hardwareDetectHandler, modelsCatalogHandler, projectDetectHandler

Storage & App interfaces (referenced)
- cmd/kernel/storage (logger, workspace store, metrics store)
  - NewLogger, NewWorkspaceStore, NewMetricsStore
  - MetricsStore.ReplaceFromJSON, MetricsStore.List
- cmd/transcripts/storage
  - NewStore, ListAllWatchesForCard

App/event forwarding
- cmd/kernel/app
  - CommandHandler and EventForwarder used by NewHandler.

UI integration
- apps/ui/src/api.ts, appSSEHandler.ts — UI code interacts with kernel endpoints (see `apps/ui/src/*`).
- apps/hal-desktop/src-tauri/src/nats.rs and hal.rs — desktop integration (Tauri).

Tests
- cmd/kernel/transport/*_test.go files test many of the behaviors above (CORS, metrics endpoints, settings proxy etc.).

---

## Core workflows (detailed sequences) {#handbook:appendix-a}

1. Command dispatch from UI
   - UI POSTs to `/api/command` with JSON payload.
   - Kernel `commandHandlerFunc`:
     - Calls `readBody()` (max 256 KiB).
     - Passes body to `app.CommandHandler.Handle(body)`.
     - Logs acceptance/rejection via `storage.Logger`.
     - Returns `res.Code`.
   - `app.CommandHandler.Handle` is authoritative for running commands, creating runs, starting agents, emitting events to `EventForwarder`, and persisting changes.

2. Event delivery to UI
   - Kernel holds `app.EventForwarder`.
   - Client connects to `/events` (GET).
   - `eventsHandlerFunc` calls `ServeSSE(forwarder, w, r)` to stream events as SSE.
   - EventForwarder emits events from app runtime; SSE pushes them to connected UIs.

3. LLM model request (streamed)
   - UI requests streaming endpoint proxied via kernel, e.g., `/api/llm-pull` (registered using `llmProxyHandler(..., stream=true)`).
   - Kernel forwards request to `<LLM_GATEWAY>/<path>` with a long client timeout.
   - Kernel streams the upstream response body to the client in a manual copy loop, flushing each chunk.

4. Metrics refresh and DB sync
   - `metricsRefresher.start()` optionally schedules periodic runs.
     - On cycle, `runScriptMode()` executes `scripts/metrics` (or incremental), then:
       - Reads produced `metrics.json`.
       - Calls `store.ReplaceFromJSON()` (under `dbSyncMu`) to sync to SQLite.
       - Calls `recordDiskSnapshotAfterSync()`.
       - Calls `checkStaleAndCreateTickets()` which may publish a NATS message to create a Kanban ticket.
   - `/api/metrics` GET:
     - Acquires `dbSyncMu`, calls `syncFromFileIfDiskChangedLocked()` if refresher present.
     - Calls `store.List()` and returns DB entries if present.
     - Otherwise reads `metrics.json` directly and returns its JSON.

5. Auto-ticket creation
   - After metrics run, `checkStaleAndCreateTickets()` parses `cache_meta.json` and for packages exceeding threshold:
     - Uses `m.nc.Publish("cmd.Kanban.CreateCard.v1", raw)` where `raw` is an JSON envelope.
     - Sets `TicketCreated = true` and writes back `cache_meta.json`.
   - Downstream consumers of `cmd.Kanban.CreateCard.v1` (Kanban service) will create tickets.

6. Compare diffs retrieval
   - UI calls `/api/compare-diffs?cardId=<id>`.
   - Kernel finds most recent run that mentions `cardId` in `plan.md` under runs root and returns diffs files contents.

---

## Operational notes, scaling & security considerations {#handbook:appendix-a}

Scaling:
- Kernel is designed as a local, single-node process; many design choices assume local resources (filesystem runs, local scripts, direct bash invocation).
- Long-lived streaming endpoints are proxied synchronously; high concurrency could consume kernel process file descriptors and goroutines. Consider:
  - Using connection pooling or dedicated streaming workers for large numbers of simultaneous streams.
  - Monitoring open file descriptors and goroutine counts.

Durability and data locality:
- Metrics DB is SQLite. DB sync operations may block until `ReplaceFromJSON` completes; `dbSyncMu` prevents torn reads but may increase latency if `ReplaceFromJSON` is heavy.
- Running `metrics` scripts can be expensive; `metricsRefresher` runs them in a single-threaded manner and avoids concurrent invocations.

Security:
- CORS is permissive to localhost dev origins; in production, restrict `allowedOrigins`.
- Settings redaction: `settingsProxyHandler` redacts `apiKey` only in logs; ensure that logs are stored securely.
- Proxying LLM APIs: kernel forwards raw JSON bodies; operators must secure the gateway endpoint (e.g., run locally or protected network).
- NATS messages contain run-envelopes; ensure NATS access control for production setups.

Failure handling & observability:
- Extensive logging is present in critical paths (settings proxy, llm proxy errors, metrics refresh failures).
- Metrics refresher logs missing bash or script failures; these are silent with respect to UI unless `/api/metrics` returns `404` or `500`.
- Consider adding health endpoints for each external dependency (LLM gateway, context) more granularly.

Testing:
- Unit tests present in `cmd/kernel/transport/*_test.go` cover:
  - CORS preflight handling (`TestCORS_OPTIONS`).
  - `/api/metrics` GET/POST behaviors and edge cases (missing file, invalid JSON).
  - Settings proxy behavior for network failure and successful forwarding.

Maintenance:
- `metricsBashExecutable()` falls back to Git bash paths on Windows; ensure correct `HAL_BASH` is exported in CI/service environments.
- `HAL_PROJECT_ROOT` and `HAL_METRICS_FILE` should be configured clearly in services (systemd, launchd) to avoid reading incorrect working directories.

---

## Reference quick index (paths) {#handbook:appendix-a}

- HTTP wiring and handlers:
  - cmd/kernel/transport/http.go
  - cmd/kernel/transport/kernel_http_handlers.go
  - cmd/kernel/transport/kernel_http_metrics.go
  - cmd/kernel/transport/kernel_http_llm_watches.go
  - cmd/kernel/transport/kernel_http_compare_diffs.go
  - cmd/kernel/transport/kernel_http_hwdetect.go

- Tests:
  - cmd/kernel/transport/http_test.go
  - cmd/kernel/transport/kernel_http_handlers_test.go
  - cmd/kernel/transport/kernel_http_metrics_test.go
  - cmd/kernel/transport/*_test.go (others are placeholders)

- App and storage integration (references, implementations elsewhere):
  - cmd/kernel/app (CommandHandler, EventForwarder)
  - cmd/kernel/storage (Logger, WorkspaceStore, MetricsStore)
  - cmd/transcripts/storage (LLM watches store)
  - internal/hwdetect
  - internal/projectdetect

- UI and desktop:
  - apps/ui/src/*
  - apps/hal-desktop/src-tauri/src/hal.rs
  - apps/hal-desktop/src-tauri/src/nats.rs

---

End of Appendix A.

---

# Appendix B: Model System {#handbook:appendix-b}

This appendix documents the model selection/resolution subsystem used by the LLM gateway. It covers model ladders (local and hosted), the bandit (Thompson sampling) selection interactions, and the resolution logic that maps model identifiers to provider endpoints or special handling (e.g., llama.cpp PM proxy). Code references use relative paths from the repository root.

Table of contents
- Files & packages referenced
- High-level architecture and responsibilities
- Tiering and ladder concepts
- Local ladder construction (detailed flow)
  - Coding tasks (implementation & QA review)
  - Context & embedding tasks
  - General/PM tasks
- Hosted ladder construction and ordering
- Exclusions, overrides, and explicit selections
- Thompson sampling (bandit) integration
- Model resolution and routing
  - storage.Resolve usage
  - Primary/fallback model logic
- Model availability / background pulls
- Special-cases and feature flags
  - Antikythera demo mode
  - llama.cpp PM backend proxy
- Key functions & call flows (mapping to code)
- Appendix: important functions and constants

---

## Files & packages referenced {#handbook:appendix-b}

Primary implementation entrypoint (handlers & ladder logic):
- cmd/llm/transport/http.go

Supporting packages (referenced in the file above):
- cmd/llm/storage (settings, model lists, provider definitions)
- internal/modelcatalog (catalog of eligible models, grouped by tier)
- internal/bandit (Thompson-sampling bandit code)
- internal/hwdetect (hardware detection and defaults per tier)
- internal/llmwatch (watch/publish events)
- cmd/llm/llamacpp (llama.cpp manager/proxy)
- cmd/llm/app (client interfaces: ChatEmbedder, ChatStreamer, Readyer)
- internal/llmctx (token estimation / JSON envelope validation)
- Note: other storage helpers referenced in the file: storage.IsLocalModel, storage.ProviderDefs, storage.ProviderConfig, storage.LocalModelsForPrefetch, etc.

Important handler functions in http.go:
- NewHandler..., Mux()                             — initialization and HTTP endpoint wiring
- watchModels                                       — builds primary/comparison ladders (main entrypoint for UI/watch)
- localModelLadderForTask                           — core local ladder synthesis logic
- hostedModelLadderForTask                          — hosted ladder construction and sorting
- localCodingLadder / localModelLadder / requiredModels / simpleTaskModel — endpoints using the ladder logic
- modelEffectiveTier / applyTierOverrides / maxModelFromSelectionOrOverrides / tierIndex — utility helpers
- hostedModelRank / sortHostedModelsForTask         — sorting/ranking hosts
- proxyToLlamaCpp / publishLlamaCppStream           — special PM proxy for llama.cpp (qwen3.5:9b)

---

## High-level architecture and responsibilities {#handbook:appendix-b}

- UI and API consumers request model lists and ladders primarily through:
  - GET /api/watch-models (returns primary, comparison, ladder, comparisonLadder)
  - GET /api/local-model-ladder
  - GET /api/local-coding-ladder
  - GET /api/simple-task-model
  - GET /api/required-models
- The handler logic in cmd/llm/transport/http.go uses:
  - persisted user settings (cmd/llm/storage) to read explicit selections, tier overrides, provider configs.
  - model catalog (internal/modelcatalog) to know which models are eligible for a role/tier given hardware constraints.
  - hardware defaults (internal/hwdetect) to obtain fallback "floor" models per hardware tier.
  - bandit (internal/bandit) to select among eligible candidates within a tier (Thompson sampling).
- The ladder building functions produce an ordered list from smallest to largest ("escalation": fast → mid → full or fast → standard → full), respecting:
  - explicit user selections (selected lists)
  - user's "max" model choice (ceiling)
  - tier overrides mapping
  - exclusions (global exclude lists or category-specific excludes)
  - availability (triggers pulls but ladder still returned using configured models)
- Hosted-model ladders use string heuristics + explicit provider-approved sets + overrides to produce deterministic sorting (rank-based sort) rather than stochastic selection.

---

## Tiering and ladder concepts {#handbook:appendix-b}

- Two primary tier orders:
  - generalTierOrder = ["fast", "standard", "full"]
  - codingTierOrder  = ["fast", "mid", "full"]
- Each "tier" maps to a set of candidate models from internal/modelcatalog.EligibleModels(roleKey, usableMemoryGB, "tools").
- Tiers are used to:
  - produce an ordered escalation ladder (small → medium → large) for local models
  - allow user "max" setting to cap escalation (prevent using bigger models than the user intended)
- Users can override model tier membership with Local.TierOverrides (per model → tier label). applyTierOverrides relocates models between tiers before selection.

Key utilities:
- modelEffectiveTier(modelID, eligible, overrides, defaultTier) — returns effective tier for a model, honoring overrides first, then catalog membership.
- applyTierOverrides(eligible, overrides) — builds a new eligible map where specified models move to the override tier.
- maxModelFromSelectionOrOverrides(explicit, overrides, tierOrder) — determines the explicit max model (ceiling) by checking user-selected explicit list first, then looking for the highest-tier override (using tierOrder priority).

---

## Local ladder construction (detailed flow) {#handbook:appendix-b}

The primary method is:
- localModelLadderForTask(task domain.TaskType) — (cmd/llm/transport/http.go)

High-level algorithm (pseudocode description):

1. Load hardware defaults and cached hw tier:
   - hw, _ := hwdetect.LoadCached()
   - floor := hwdetect.DefaultsForTier(hw.Tier)

2. Load user selections and tier overrides:
   - selected := h.selectedLocalModels() // picks the per-category saved arrays
   - tierOverrides := h.store.Get().Local.TierOverrides // may be nil

3. Switch by task:
   - Implementation & QAReview (coding tasks) — special process (see below)
   - ContextQuery (embedding) — embedding is single-model (no bandit)
   - Default/General/PM tasks — alternative process (described below)

### Coding tasks (Implementation, QAReview) {#handbook:appendix-b}

Detailed steps (from code comments and implementation):

- Retrieve:
  - excluded := h.excludedModelsSet("coding")
  - eligible := modelcatalog.EligibleModels("coding", hw.UsableMemoryGB, "tools")
  - eligible = applyTierOverrides(eligible, tierOverrides["coding"])
  - stats := bandit.StatsForRole("coding") // bandit telemetry for Thompson sampling

- Determine user's ceiling (max tier / maxModel):
  - maxModel := maxModelFromSelectionOrOverrides(selected.codingMax, tierOverrides["coding"], codingTierOrder)
  - If maxModel != "" => maxTier = modelEffectiveTier(maxModel, eligible, overrides, "full")
  - maxIdx = index of maxTier in codingTierOrder (clamped)

- Prepare explicit per-tier lists (user-approved lists):
  - explicitByTier := {fast: selected.codingFast, mid: selected.codingMid, full: selected.codingFull}

- For each tier from lowest to maxIdx:
  - chosen := "" (initially)
  - If this tier == maxTier and maxModel is set and not excluded => chosen = maxModel (explicit ceiling enforcement)
  - If chosen == "" and explicit picks exist for this tier:
    - If eligible has candidates in this tier:
      - chosen = selectConfiguredTierModel(explicitList, candidates, excluded, stats)
        - Purpose: prefer a user-approved pick which is also in the catalog; uses bandit when multiple choices available (see selectConfiguredTierModel)
  - If chosen == "":
    - If eligible[tier] has candidates:
      - filtered := filterExcluded(candidates, excluded)
      - chosen = bandit.Select(filtered, stats)
        - bandit.Select chooses one candidate using the bandit algorithm (Thompson sampling)
  - If chosen still empty, fall back to floor.CodingFast / Mid / Full
  - Append chosen to base ladder

- Post-process: ensure explicitly selected maxModel appears as the last element (ceiling) even if not in the eligible set.

- Deduplicate, trim empty entries, and ensure all models are local models (storage.IsLocalModel(m)).

Notes:
- selectConfiguredTierModel() exists to reconcile explicit user picks with catalog candidates. It likely performs intersection and uses bandit when multiple approved models exist; if none match, falls back to bandit across the tier.
- The order produced is already correct escalation (fast → mid → full). No re-sort is performed.

### Context/Embedding tasks {#handbook:appendix-b}

- Embedding is intentionally single-model and deterministic:
  - If user explicitly set an embedding model (selected.embedding array) use it
  - Else use registry's GetModelForTask or hardware default floor.Embedding
- No bandit selection: switching embedding models requires re-embedding, so the system avoids stochastic switching.

### General/PM tasks {#handbook:appendix-b}

- Similar to coding but uses generalTierOrder and slightly different defaulting:
  - excluded := h.excludedModelsSet("general")
  - eligible := modelcatalog.EligibleModels("general", hw.UsableMemoryGB, "tools")
  - eligible = applyTierOverrides(eligible, tierOverrides["general"])
  - stats := bandit.StatsForRole("general")

- Determine maxModel via maxModelFromSelectionOrOverrides(selected.general, tierOverrides["general"], generalTierOrder)
  - defaultMaxTier := "fast" (unless maxModel set, in which case treat as "full" possibility)
  - maxTier := modelEffectiveTier(maxModel, eligible, overrides, defaultMaxTier)
  - maxIdx := tierIndex(maxTier, generalTierOrder)

- For each tier up to maxIdx:
  - If eligible[tier] exists and after filtering exclusions:
    - m := bandit.Select(filtered, stats)
    - append m to ladder

- If no candidate was added, fallbackGeneral = h.reg.GetModelForTask(task) or floor.General

- Always append the maxModel as ceiling if explicitly set (even if not in eligible).

- Deduplicate/trim same as coding path.

---

## Hosted ladder construction and ordering {#handbook:appendix-b}

Function: hostedModelLadderForTask(task domain.TaskType) in cmd/llm/transport/http.go

Overview:
- Hosted ladder is built from the non-local (hosted) provider(s) that user has configured in storage settings.
- Only returns a ladder when the user has a selected "max" non-local model for the task (FirstNonLocalModelForTask).
- Uses providerApprovedModelsForTask to collect approved model lists from each configured provider (or provider defs if the provider has no explicit approved list).
- Ordering is deterministic: sortHostedModelsForTask uses hostedModelRank(task, model, overrides) to produce a stable ranking based on heuristics.

Heuristics (hostedModelRank):
- Tier overrides are respected first and mapped to rank "rungs" (fast->10, standard/mid->20, full->30).
- Fallback string heuristics are used:
  - For coding tasks: look for substrings "nano", "mini", "gpt-5", "codex", "max", and variants of version numbers (5.4/5.3/5.2/5.1) to increase rank.
  - For general: similar but includes "o4-mini", "o3-mini", "o3", "o1-mini", "o1", "gpt-4.1", "gpt-4o", "gpt-5", etc. and minor version bumps (5.3/5.2/5.1) adjust rank.

providerApprovedModelsForTask(provider, task, overrides, excluded):
- If provider.ApprovedModels list is empty, iterate provider definition’s ModelIDs and pick those matching hostedModelMatchesTask(task, model)
- If provider has an explicit ApprovedModels list, select the intersection but still filter by hostedModelMatchesTask
- Calls sortHostedModelsForTask at the end to order the returned model set.

hostedModelMatchesTask:
- Very lightweight string checks to ensure hosted models make sense for the task:
  - TaskContextQuery: model name must contain "embedding"
  - Implementation/QAReview: name contains "codex" OR "gpt-5"
  - Others: discard models containing "embedding" or "codex" inappropriately

---

## Exclusions, overrides, and explicit selections {#handbook:appendix-b}

Key concepts:
- Excluded models: The system supports user or category-based exclusions. Functions referenced:
  - h.excludedModelsSet(roleKey) — returns a set of excluded model IDs for the role.
  - h.excludedModelsUnion() — used when computing required models (prefetch) to skip excluded models unless explicitly requested.
  - filterExcluded(candidates, excluded) — helper to remove excluded models from catalog candidates.

- Explicit selections:
  - selected := h.selectedLocalModels() returns a structure with arrays:
    - selected.codingFast, selected.codingMid, selected.codingFull
    - selected.codingMax
    - selected.general (explicit selected models for general tasks)
    - selected.embedding (explicit embedding model)
    - selected.simpleTask
  - The system prefers explicit choices when present and only uses bandit for tie-breaking or candidate selection among multiple explicit candidates.

- Tier overrides: local model settings allow moving a given model into a different tier. applyTierOverrides constructs a new eligible map where those models are relocated; modelEffectiveTier consults overrides first to reflect the user's preference for a model's effective tier.

- maxModelFromSelectionOrOverrides(explicit, overrides, tierOrder): returns explicitly selected max model if present. Otherwise, it finds the model from overrides whose override tier is highest in the tierOrder. This makes explicit user ceiling choices and manual tier moves act as a limit to escalation.

---

## Thompson sampling (bandit) integration {#handbook:appendix-b}

- The code integrates with internal/bandit for stochastic selection. Calls observed in the code:
  - stats := bandit.StatsForRole("coding" | "general")
  - bandit.Select(filteredCandidates, stats) — pick a model from the supplied candidate set
  - selectConfiguredTierModel(..., stats) — also uses bandit internally to choose among configured candidates

Design rationale (how it's used):
- Thompson sampling (a.k.a. Bayesian bandit) is used to:
  - Smoothly explore among multiple eligible models within a tier (avoid deterministic behavior that locks to a single model).
  - Prefer models with better historical performance while still occasionally sampling others (exploration vs. exploitation).
  - Enable telemetry-driven selection; StatsForRole collects historical success/failure or quality metrics per model/role to feed the bandit posterior.

Typical bandit contract inferred from usage:
- StatsForRole(role) returns telemetry counts used to form priors/posteriors (e.g., successes/failures or reward samples per model).
- Select(models, stats) returns one model id from models using a Thompson-sampling-like draw across models.
- Bandit is called per-tier where there can be multiple acceptable candidates (explicit or catalog).

Implementation notes / caveats:
- The system uses the bandit selection only within a tier; tier ordering is still driven by deterministic rules.
- Hosted ladders do not use bandit sampling for ordering; they use deterministic rank heuristics.
- Because bandit returns a stochastic pick among candidates, ensure logging/metrics capture which candidate was chosen and why (the code logs model choices and prompt sizes at call time).

---

## Model resolution and routing {#handbook:appendix-b}

Model resolution is the process that maps a model identifier to:
- a local Ollama instance model name (for models that are "local"),
- or a hosted provider model identifier and thus host URL,
- or special internal reroutes (e.g., llama.cpp PM proxy).

Key functions and uses:

1. storage.IsLocalModel(modelID)
   - Predicate used throughout to separate local vs hosted models.

2. storage.Resolve(modelID) -> (baseUrl, extra, ok)
   - Used in requiredModels to find a provider URL for models that may be non-default.
   - When the settings store has an override for where to resolve a model, Resolve returns that base URL and an ok flag.

3. h.reg.GetModelForTask(task)
   - Registry-level configured primary model for a given task. Used as a fallback or reporting primary.

4. Model substitution logic in chatCompletions:
   - If a model ID is empty, use h.reg.GetModelForTask(task)
   - For non-local models, if the store has a non-local provider configuration and store.Resolve(model) fails (i.e., no resolution), then the handler may substitute the first non-local model configured in settings: h.store.FirstNonLocalModel()
   - This substitution only applies for non-local models (explicit local model IDs are preserved).

5. requiredModels endpoint:
   - Builds a prefetch list (LocalModelsForPrefetch(s, "qwen3.5:9b")) and filters based on excluded models and whether the model resolves to an Ollama base URL (only Ollama-based local models are prefetch candidates).
   - Uses h.store.Resolve to find per-model resolve base (so models can be configured to be pulled from different Ollama instances).

6. proxying to llama.cpp:
   - For PM chat tasks, when PM backend is set to llamacpp and its manager is "ready", the gateway proxies the entire chat request to a local llama-server OpenAI-compatible endpoint and marks certain headers so upstream code suppresses duplicate watch events.

Important behavior summary:
- Local models (qwen*, gpt-like model markers in config) go to Ollama or local LLM hosting; host selection is based on store.Resolve or default ollamaBaseURL.
- Hosted models (non-local) are only used when the provider is configured and approved; otherwise fallback substitution is performed.
- storage.NormalizeMode(mode) is used in setting workflow; stored settings decide when to prefer local vs hosted ladders.

---

## Model availability / background pulls {#handbook:appendix-b}

- ensureBanditModelsAvailable(ladder) is invoked from endpoints that expose local ladders (e.g., localCodingLadder and watchModels). Its responsibility:
  - For each model in the ladder, check whether it's installed on the primary Ollama instance (or configured embed instance when appropriate).
  - Trigger a background pull via /api/pull to the ollamaBaseURL (or per-model Resolve URL) for missing models.
  - Deduplicate concurrent background pulls using:
    - h.pullingMu sync.Mutex and h.pullingModels map[string]bool — prevents starting multiple pulls for the same model
  - Possibly logs progress and uses llama.cpp manager to start/stop PM backend when switching backends.

- Embed-specific pull behavior:
  - simpleTaskModel will detect a configured HAL_EMBED_OLLAMA_URL and, if the chosen model is missing on the embed instance, fire off a background pull to install it on the embed (best-effort; embedPullStarted flag indicates attempted pull).

Behavioral guarantees:
- The ladder endpoints still return a ladder even if models are missing; ensureBanditModelsAvailable may return a subset of models that are available or the complete ladder while starting pulls as background operations.
- The primary purpose is user experience: the UI sees a ladder that represents "what will be used", and the service attempts to ensure availability proactively.

---

## Special-cases and feature flags {#handbook:appendix-b}

Antikythera demo mode:
- storage.IsAntikytheraDemo() triggers alternate logic paths:
  - Hosted-only ladder: local ladder is nil
  - For watchModels and prefetch, the Antikythera-specific ladders and models are returned (via storage.AntikytheraLadder etc.)
  - simpleTaskModel returns a hard-coded Antikythera model primary
- This is used for hosted/demo deployments where local models are not applicable.

llama.cpp PM backend proxy:
- Constant: llamaCppModelName = "qwen3.5:9b (llama.cpp)"
- pm backend selection is persisted in store (storage.GetPMBackend())
- If PM backend == storage.PMBackendLlamaCpp and llamacpp manager status == "ready" and task is a PM task (isPMTask(task) true for TaskChat, TaskSpecTickets, TaskHalChat), the HTTP handler proxies chat completions to the llama.cpp server endpoint:
  - proxyToLlamaCpp() forwards request and then:
    - For streaming, tees the SSE stream to client and to publishLlamaCppStream that publishes NATS llmwatch events chunk-by-chunk
    - For non-streaming, parses response once and publishes a final llmwatch.PublishModelDone event
- watchModels recognizes the active llama.cpp PM backend and returns a single-ladder JSON with llamaCppModelName as primary.

---

## Key functions & call flows (mapping to code) {#handbook:appendix-b}

Core endpoints and where they route:
- GET /api/watch-models -> Handler.watchModels (cmd/llm/transport/http.go)
  - Calls:
    - h.reg.GetModelForTask(task) — registry primary
    - h.localModelLadderForTask(task)
    - h.hostedModelLadderForTask(task)
    - h.ensureBanditModelsAvailable(ladder) — triggers pulls and filters ladder to available models (best-effort)
  - Special-case: llama.cpp PM backend overrides and Antikythera demo

- GET /api/local-model-ladder?task=<task> -> Handler.localModelLadder
  - Calls h.localModelLadderForTask(task) (same core algorithm)

- GET /api/local-coding-ladder -> Handler.localCodingLadder
  - Specialization of localModelLadderForTask for coding tasks that also synthesizes "fast/mid/full" representative picks
  - Uses modelEffectiveTier to map ladder entries back to tiers and hardware defaults as fallback.

- GET /api/simple-task-model -> Handler.simpleTaskModel
  - Chooses a representative small model for simple tasks:
    - Looks at selected.simpleTask, then hardware floor.SimpleTask, then fallback to "qwen3.5:4b"
  - If embed Ollama configured, ensures model presence on embed instance using background pull logic.

- POST /v1/chat/completions -> Handler.chatCompletions
  - Resolves model:
    - If req.Model empty -> h.reg.GetModelForTask(task)
    - If non-local model and store.HasNonLocalProvider() && !storage.IsLocalModel(model):
      - Try store.Resolve(model). If unresolved, use h.store.FirstNonLocalModel()
  - PM llama.cpp proxy check and proxying logic
  - Calls client.ChatWithModelAndOptions for regular calls or ChatStream for streaming ones.

Bandit selection flow:
- localModelLadderForTask builds eligible candidates per tier then calls bandit.Select(filtered, stats).
- selectConfiguredTierModel (used for explicit per-tier lists) uses bandit to choose when multiple explicit candidates exist.

Model prefetch flow (/api/required-models):
- Compute LocalModelsForPrefetch(s, defaultModel)
- Exclude excluded models unless explicitly set
- Resolve per-model base URL via store.Resolve; only include models that resolve to an Ollama base URL (only Ollama-local models are prefetch candidates)

Model pull deletion:
- POST /api/pull -> proxy to Ollama /api/pull and stream progress back to the caller.
- POST /api/delete-model -> proxy to Ollama /api/delete to remove model.

---

## Appendix: important constants & helpers (from http.go) {#handbook:appendix-b}

- Tier orders:
  - generalTierOrder = []string{"fast", "standard", "full"}
  - codingTierOrder  = []string{"fast", "mid", "full"}

- llamaCppModelName = "qwen3.5:9b (llama.cpp)" — used as the proxy model label for llama.cpp PM backend

- Utility helpers:
  - func modelEffectiveTier(modelID string, eligible map[string][]modelcatalog.CatalogModel, overrides map[string]string, defaultTier string) string
  - func applyTierOverrides(eligible map[string][]modelcatalog.CatalogModel, overrides map[string]string) map[string][]modelcatalog.CatalogModel
  - func tierIndex(tier string, tierOrder []string) int
  - func maxModelFromSelectionOrOverrides(explicit []string, overrides map[string]string, tierOrder []string) string
  - func hostedModelMatchesTask(task domain.TaskType, model string) bool
  - func hostedModelRank(task domain.TaskType, model string, overrides map[string]string) int
  - func sortHostedModelsForTask(task domain.TaskType, models []string, overrides map[string]string)

---

## Design rationale and tradeoffs {#handbook:appendix-b}

- Deterministic ladder structure with stochastic picks only inside a tier:
  - The system aims to keep the ladder ordering deterministic (fast→mid→full) to provide predictable escalation behavior.
  - Stochastic behavior (bandit/Thompson sampling) is applied within a tier to rotate among candidate models and adapt to telemetry, preventing single-model lock-in and enabling online learning.

- Respect explicit user choices and overrides:
  - Users' explicit selections (per-tier lists and an explicit max model) are given priority. The code always tries to respect the explicit max (ceiling), and when an explicit per-tier pick exists, it is preferred over bandit selection.

- Embeddings are single-model:
  - Switching embedding models triggers a re-embedding of stored artifacts; to avoid unexpected regressions and long re-embedding ops, the system enforces a single embedding model (no bandit).

- Hosted model ordering via heuristics:
  - Hosted backends can expose many models with inconsistent naming. The system uses ranking heuristics and explicit overrides to present a sensible "comparison" ladder for hosted models while respecting provider-approved lists.

- Pre-fetch and background pulls:
  - Missing local (Ollama) models are installed proactively on demand. Background pulls are deduplicated and bounded by per-request contexts (e.g., pull proxy uses a long timeout for the actual pull but the API remains responsive).

- PM (project management / chat) tasks can be routed to llama.cpp:
  - Allows a local CPU/GPU server to serve PM tasks with small weights (e.g., qwen3.5:9b) when the PM backend is switched to llama.cpp — optimizing for cost and latency for routine PM traffic.

---

## Implementation pointers & troubleshooting {#handbook:appendix-b}

- To inspect candidate sets per tier:
  - Look at internal/modelcatalog.EligibleModels("coding" | "general", hw.UsableMemoryGB, "tools")
  - Ensure your hardware usable memory and model catalog are consistent for expected membership.

- To change deterministic ordering or heuristics for hosted models:
  - Edit hostedModelRank() and sortHostedModelsForTask() in cmd/llm/transport/http.go.

- To influence bandit behavior:
  - Examine internal/bandit implementation. StatsForRole(role) and Select(candidates, stats) are the contract points used by transport/http.go.
  - Ensure telemetry ingestion updates the bandit stats reliably for Thompson sampling to adapt.

- To debug missing model pulls and background behavior:
  - Search for ensureBanditModelsAvailable and logic that triggers POST /api/pull to ollamaBaseURL (proxy logic in pull()).
  - The pullingMu / pullingModels map is used to avoid duplicate pulls — check logs to diagnose why a second pull may not be triggered.

- To see what the UI will receive for a task ladder:
  - Call GET /api/watch-models?task=<task> — it will respond with:
    - primary: string
    - comparison: string
    - ladder: []string (local ladder)
    - comparisonLadder: []string (hosted ladder)

---

This appendix focused on model ladders, bandit-based selection (Thompson sampling), and model resolution logic implemented primarily in cmd/llm/transport/http.go and supported by internal/modelcatalog, internal/bandit, cmd/llm/storage, and hwdetect. For any change that affects how models are chosen, test both ladder endpoints and the chat routing behavior (including PM proxy to llama.cpp) to ensure user expectations and cost/performance goals remain satisfied.

---

# Appendix C: Agent Lifecycle {#handbook:appendix-c}

This appendix documents the full lifecycle of agents in the PM (project-management) domain: how agents are instantiated, how they process incoming events and user messages, how they consult LLMs and context services, how they make decisions and execute actions via NATS, and how they produce outputs/events for the rest of the system. The description references concrete code, constants, topics, and helper behaviors found in the repository.

Table of contents
- Overview
- Key files and paths
- Agent startup (construction)
- Receiving and routing an agent request
- LLM & context interactions
- Conversation history and context windowing
- Intent extraction and decision schema
- Intent execution -> NATS commands
- Board lookup and display-number → internal ID resolution
- Batch operations and ordering
- Confirmation, retry, and history-replay handling
- Events emitted by agents
- Timeouts, resilience, and testing hooks
- Message and envelope schemas
- Design decisions and rationale
- Troubleshooting / observability notes
- How to extend / add a new action

---

## Overview {#handbook:appendix-c}

The PM agent is implemented in cmd/pm/app. It accepts external chat/agent requests (cmd.Agent.ChatRequest.v1), composes a prompt with optional card/board context, queries an LLM (via an LLM gateway), interprets the LLM output (intents / JSON actions), and executes resulting actions by publishing commands to the Kanban service over NATS. The agent publishes run lifecycle events (run started / progress / to-user messages / completed) so UIs and orchestration layers can track or present the run.

High-level lifecycle:
1. Start: instantiate a Handler (agent entrypoint).
2. Receive chat request -> canonicalize into ChatRequest -> call HandleChatRequest.
3. Build/trim conversation + fetch context (board/card, external context service).
4. Call LLM gateway with composed prompt (with timeouts).
5. Parse LLM response (intent, requested_action, or JSON array of actions).
6. If intent requires board introspection, query Kanban service for cards (via NATS) and wait for GetBoard result.
7. Translate actions into commands (cmd.Kanban.*) and publish them to NATS, possibly in order or batch.
8. Emit agent events (evt.Agent.*) for run lifecycle and to-user messages.

---

## Key files and paths {#handbook:appendix-c}

- Agent entry and primary logic:
  - cmd/pm/app/handler.go
  - cmd/pm/app/handler_test.go (comprehensive behavioral tests and examples of expected flows)
- Domain & types:
  - cmd/pm/domain (types referenced: AgentChatRequest, ChatRequest, ChatResponse, ChatMessage, etc.)
- Storage / logging:
  - cmd/pm/storage (Logger used by Handler)
- LLM testing and mocks:
  - internal/llmwatch (test mock for LLM interactions used in tests)
- NATS support in other apps:
  - apps/hal-desktop/src/hal.rs and nats.rs (desktop client interactions)
- Front-end sample flows:
  - apps/ui/src/runAgentForCard.ts (UI-side invocation of running an agent per card)
- Project-level configs (defaults for env):
  - .env.example
  - antikythera/.env.example

Note: The most relevant implementation references for agent lifecycle are in cmd/pm/app/handler.go and the tests in cmd/pm/app/handler_test.go that exercise and document behavior via integration-style tests with an embedded NATS server.

---

## Agent startup (construction) {#handbook:appendix-c}

Handler constructors:

- NewHandler(log *storage.Logger, nc *nats.Conn) *Handler
  - Picks default LLM gateway URL: environment variable `LLM_GATEWAY_URL` or default "http://127.0.0.1:11434" (local Ollama gateway for developer mode).
  - Picks default context service URL: `CONTEXT_URL` or default "http://127.0.0.1:8092".
  - Default workspace path is ".".
  - Stores the NATS connection (nc) and the logger.

- NewHandlerWithWorkspace(log *storage.Logger, workspace string, nc *nats.Conn) *Handler
  - Same as NewHandler but accepts explicit workspace path (non-empty enforced as ".").

Constructor responsibilities:
- configure endpoints (LLM, context)
- set workspace path
- bind to a NATS connection for publishing commands and subscribing to responses

Files:
- cmd/pm/app/handler.go: NewHandler, NewHandlerWithWorkspace

Design notes:
- Defaulting to a local Ollama gateway facilitates local developer experience.
- The Handler is minimal and stateless per se — it keeps configuration and NATS handle. Each chat run is handled in methods that may perform network calls, subscriptions, and local decision-making.

---

## Receiving and routing an agent request {#handbook:appendix-c}

Entrypoint for "agent chat" requests:

- HandleAgentChatRequest(payload json.RawMessage, runID, corrID string) *domain.ChatResponse
  - Expects payload to unmarshal to domain.AgentChatRequest (fields: AgentType, Message, History, Context, WorkspacePath, CardID, RefineForReadyToDoReason).
  - Validates AgentType == "PM" (returns ChatResponse{Message: "Agent chat only supported for PM."} if not).
  - Constructs a domain.ChatRequest with the relevant fields and forwards to HandleChatRequest (not shown in snippet but referenced).
  - runID and correlation ID are passed through for event tracking.

Files:
- cmd/pm/app/handler.go: HandleAgentChatRequest

Design notes:
- The Handler supports multiple entrypoint variations (direct ChatRequest vs AgentChatRequest wrapper). This allows other components to call either directly depending on context (UI vs message bus).
- runID & corrID are used for correlating agent runs with events and external operations.

---

## LLM & context interactions {#handbook:appendix-c}

Primary LLM/config values:
- llmTimeout = 300s (5 minutes) // long-running model runs
- llmConnectTimeout = 20s // fail fast if LLM gateway unreachable

Handler fields:
- llmURL string (LLM gateway)
- contextURL string (context service for repository or card context)
- nc *nats.Conn (NATS connection)

LLM usage pattern:
- Compose prompt using user message, optional card context (card title/description, DoR), optionally include content from the context service (if a codebase/need query was detected).
- Submit request to LLM gateway endpoint (HTTP). In tests, calls to the LLM are commonly mocked via internal/llmwatch:
  - llmwatch.UseMock = true
  - llmwatch.RegisterMockResult("chat", `...`, "")
- When mocked, executeChatIntent and other flows read the mock rather than performing real HTTP calls.

Context service:
- contextURL defaults to "http://127.0.0.1:8092".
- Typically used to answer NEED: queries that require searching a codebase or retrieving files relevant to a ticket.

Time limits:
- Acquire LLM result within llmTimeout (300s).
- Fail-fast on connecting to gateway if not reachable within llmConnectTimeout.

Design notes:
- Long llmTimeout reflects the possibility of large prompts and slow models (e.g., local Ollama, qwen).
- llmConnectTimeout is smaller to avoid long stalls if the gateway is down (improves UX when services are misconfigured).

---

## Conversation history and context windowing {#handbook:appendix-c}

Constants:
- maxChatHistoryMessages = 12
- minMessageWordsForContext = 3

Behavior:
- When building the prompt to send to LLM, the Handler maintains a sliding window of up to maxChatHistoryMessages messages to keep the prompt bounded.
- It filters out short assistant/user messages that are unlikely to contain useful context (minMessageWordsForContext = 3). This helps avoid sending irrelevant one-word messages.
- History can also be scanned for previously emitted assistant JSON containing actionable payloads (recoverCreateCardFromHistory). This supports "recovering" an intended create_card from earlier assistant content if the user confirms a creation.

Helpers / referenced tests:
- recoverCreateCardFromHistory scans an ordered history of domain.ChatMessage (assistant wins when multiple assistant messages contain ticket proposals).
- extractJSONObject / extractJSONObjectAll are used to parse JSON payload fragments from assistant responses.
- fallbackDoRTemplate supplies a DoR template if a card's description lacks key headings.

Design notes:
- Sliding window guarantees predictable prompt size while keeping recent context available.
- Recovery & parsing logic enable robust multi-turn flows where the assistant emits JSON for an action and the user confirms.

---

## Intent extraction and decision schema {#handbook:appendix-c}

LLM outputs:
- LLM is expected to return structured JSON or natural language containing structured JSON. Typical structured payload used in tests:
  - `{"intent_type":"action","requested_action":"update_card","execution_ready":true,"confidence":1.0}`
- LLM may also return a JSON array of action objects: `[{"action":"delete_card","column":"QA","count":1}, ...]`.

Decision object:
- executeChatIntent returns human-facing result string and, in many tests, a decision struct that indicates fields such as RequestedAction, ExecutionReady, etc.

Intent detection:
- Handler parses the LLM output to determine intent_type (e.g., "action") and requested_action (e.g., "update_card", "delete_card_by_id", "move_column", "move_card", "create_card", "other").
- For textual outputs, parsing helpers attempt to extract JSON blocks via extractJSONObject/All. parseActionIntents parses arrays of action objects.

Edge / error cases:
- LLM may misclassify actions: tests show flows where model emits `create_card` while the user intent and context indicate bulk deletion; handler logic repairs misclassification by consulting board contents and user message.
- If execution_ready == false, the handler will produce a to-user message asking for clarifications instead of executing.

Design notes:
- Accept both single-action JSON and arrays to support batch decisions.
- Parsing is permissive: JSON may be embedded in prose; helpers extract it robustly.

---

## Intent execution -> NATS commands {#handbook:appendix-c}

Mapping from requested_action / action objects to NATS topics:

Common NATS command topics (constants in handler.go):
- cmdKanbanMoveCard = "cmd.Kanban.MoveCard.v1"
- cmdKanbanUpdateCard = "cmd.Kanban.UpdateCard.v1"
- cmdKanbanSetActiveWorkMeta = "cmd.Kanban.SetActiveWorkMeta.v1"
- cmdKanbanDeleteCard = "cmd.Kanban.DeleteCard.v1"
- cmdKanbanDeleteCardsInColumn = "cmd.Kanban.DeleteCardsInColumn.v1"
- evtAgentRunStarted, evtAgentRunProgress, evtAgentMessageToUser, evtAgentRunCompleted

Examples of action → command mapping (observed in tests):
- action "update_card" -> publish to cmd.Kanban.UpdateCard.v1 with payload containing id, title, description, workspacePath.
- action "delete_card_by_id" -> publish cmd.Kanban.DeleteCard.v1 with payload {id, workspacePath}.
- action "delete_card" with column & count and when count>0 -> possibly bulk delete: cmd.Kanban.DeleteCardsInColumn.v1 with {column, count, workspacePath}
- action "move_column" (bulk move column) -> get cards in 'fromColumn' via GetBoard, then send cmd.Kanban.MoveCard.v1 for each card with toColumn, toLane, toIndex.
- action "move_card" (single) -> cmd.Kanban.MoveCard.v1 with id, toColumn, toLane, toIndex.
- action "create_card" -> probably cmd.Kanban.CreateCard.v1 (not shown in test but implied by UI flows). Handler recovers card content from history when needed.

Envelope shape used in tests when communicating via NATS:
- Outgoing command published by other services is expected to be wrapped in an envelope for result flows. Handler tests publish/subscribe to/from topics directly with JSON payloads or small envelopes containing "payload" or "correlationId".

Patterns in tests:
- To resolve displayNumber → internal ID mapping, the Handler publishes "cmd.Kanban.GetBoard.v1". The Kanban service responds on "evt.Kanban.GetBoard.Result.v1" with a payload shaped: {"cardsByColumn": { "ColumnName": [{ "id": "card_abc123", "displayNumber": 1, "column": "To Do" }, ...] } } wrapped in an env object with "correlationId".

Implementation notes:
- Handler subscribes to relevant response topics or blocks waiting for a matching correlationId to map display numbers or column membership.
- For single-ID delete vs bulk delete decision: when LLM returns a single `id` but user message asks to delete "all in Unassigned", the Handler calls GetBoard and issues DeleteCardsInColumn.v1 with { column: "Unassigned", count: N }.
- For deletion of specific IDs found in a JSON batch array, the handler iterates and publishes DeleteCard.v1 for each id.

---

## Board lookup and display-number → internal ID resolution {#handbook:appendix-c}

Problem:
- Users often refer to tickets as human-facing AK/HAL/number references (display numbers); internal backend uses internal IDs. The agent must translate display references to internal IDs.

Flow:
1. Handler publishes cmd.Kanban.GetBoard.v1 (request) — tests subscribe to this in order to return board state.
2. Kanban service publishes evt.Kanban.GetBoard.Result.v1 with payload:
   - correlationId (matches request)
   - payload: {"cardsByColumn": { "QA": [{"id":"internal_id","displayNumber":5,"column":"QA"}, ...], ... }}
3. Handler queries this response, finds the card with matching displayNumber (e.g., 5) and/or card title and resolves to internal id (e.g., "card_internal_5").
4. Publish subsequent commands (update/delete/move) using internal id.

Example test flows:
- TestExecuteChatIntent_UpdateCardResolvesDisplayNumber:
  - LLM intent -> update_card with id "HAL-0001" (display form)
  - Handler publishes GetBoard; receives mapping: displayNumber 1 -> id "card_abc123"
  - Handler publishes cmd.Kanban.UpdateCard.v1 with id "card_abc123"

Envelope format:
- Request: usually raw JSON or may include correlationId in tests
- Response: env with correlationId and payload as raw JSON (see tests)

Design notes:
- This two-step resolution is essential to bridge user-facing references and internal identifiers.
- Handler must reliably match correlationId in request/response patterns.

---

## Batch operations and ordering {#handbook:appendix-c}

Behavior demonstrated in tests:
- If LLM returns a JSON array representing multiple actions (e.g., delete several columns or move column's cards), Handler iterates over array and executes actions.
- For move_column (move all cards from Human Review -> Done), handler calls GetBoard to get cards in the fromColumn and publishes MoveCard.v1 for each card.

Ordering:
- Tests verify expected ordering of MoveCard messages:
  - Example: Human Review had two cards hr1 (displayNumber 1), hr2 (displayNumber 2); expected order from Handler is hr2 then hr1 (reverse). This implies Handler places tickets in destination using an order-preserving insertion that results in reverse iteration or deliberate ordering to preserve ordering on target column. Implementation detail: Handler likely iterates the board cards in reverse displayNumber order when issuing MoveCard commands so that final order in destination is as intended.

Bulk deletion:
- Handler distinguishes between single-id delete and full-column delete:
  - If LLM returned action with column and count, Handler may publish DeleteCardsInColumn.v1 with count and column.
  - If LLM returned a single id but the user asks "delete all in Unassigned", Handler resolves it to a column bulk delete after calling GetBoard.

Atomicity & concurrency:
- Handler publishes individual messages per item for Move or Delete-by-id.
- Bulk deletion uses a specialized DeleteCardsInColumn.v1 so backend can optimize.
- There is no explicit transaction handling at the handler level — commands are issued asynchronously and success/failure handling is deferred to the Kanban service/other subscribers.

---

## Confirmation, retry, and history-replay handling {#handbook:appendix-c}

Confirmation detection:
- The handler uses heuristics to detect affirmative responses (isConfirmation) for confirming create/update/delete actions. Tests enumerate phrases like "yes", "create it", "do it", "go ahead", "ok".

Retry handling:
- If user asks to retry (isRetryRequest: e.g., "try again", "one more time"), the handler allows executing a new update even if prior assistant message already had an "update_card" JSON payload; logic in executeChatIntent allows re-executing based on history and the presence of a retry request.

Recovering lost actions:
- recoverCreateCardFromHistory scans earlier assistant messages for JSON payloads for create_card and extracts Title and Description (or unstructured "Title: X" prose blocks). This enables confirmation flows where assistant proposes a create payload and user confirms with "yes"; the handler will recover the proposed content and execute the create.

Blocked NEEDs:
- A "NEED:" prefix in messages triggers special handling for codebase queries; blocked meta-requests or ambiguous NEEDs can be identified (extractNeedQuery, isBlockedNeedResponse). The handler will ask for clarification if the NEED request is meta (not actionable).

Design notes:
- The system tries to avoid accidental destructive actions by requiring a clear execution_ready decision from the LLM, plus human confirmation for ambiguous actions.

---

## Events emitted by agents {#handbook:appendix-c}

Constants in cmd/pm/app/handler.go:
- evtAgentRunStarted = "evt.Agent.RunStarted.v1"
- evtAgentRunProgress = "evt.Agent.RunProgress.v1"
- evtAgentMessageToUser = "evt.Agent.MessageToUser.v1"
- evtAgentRunCompleted = "evt.Agent.RunCompleted.v1"

Event semantics:
- RunStarted: emitted at the beginning of a run (includes runID/correlation info).
- RunProgress: emitted during long-running runs to report progress percentage or phases.
- MessageToUser: textual messages intended for UI display (LLM clarifications, "I've updated the ticket", or "Deleted ticket HAL-0005.").
- RunCompleted: emitted when the run finishes (success/failure and summary).

Where events are produced:
- Handler methods like HandleChatRequest / executeChatIntent are expected to publish these events over NATS using h.nc. The actual publishing calls are not shown in the snippet but constants are used by tests and other code to expect such behavior.

Design notes:
- Distinct topics for lifecycle allow UIs to stream progress for running agents (e.g., show intermediate LLM responses or confirm when modifications happen).

---

## Timeouts, resilience, and testing hooks {#handbook:appendix-c}

Timeouts / reliability:
- llmConnectTimeout (20s) used to fail fast if LLM gateway unreachable.
- llmTimeout (300s) used to cap LLM inference duration.
- NATS communication uses correlationId to correlate requests and responses. Tests use natstest.RunRandClientPortServer() to spawn an in-process NATS server, and connect with nats.Connect.

Testing hooks:
- llmwatch.UseMock toggles LLM mock mode; llmwatch.RegisterMockResult lets tests inject deterministic LLM outputs to drive handler flows without network LLM calls.
- Tests spin up a NATS server and subscribe to the topics they expect the handler to publish, then assert the payload shapes and payload values.
- Tests also simulate Kanban service responses by subscribing to cmd.Kanban.GetBoard.v1 and publishing evt.Kanban.GetBoard.Result.v1 with matching correlation IDs.

Design notes:
- The use of llmwatch and embedded NATS servers indicates the codebase favors integration-style tests for behavioral guarantees rather than unit tests for each helper.

---

## Message and envelope schemas {#handbook:appendix-c}

Observations from tests:

GetBoard request / response:
- Request: Handler publishes to cmd.Kanban.GetBoard.v1, often with a "correlationId" in an envelope (test constructs an env with CorrelationID, etc.).
- Response topic: evt.Kanban.GetBoard.Result.v1
  - Response envelope (as seen in tests):
    {
      "correlationId": "<id>",
      "payload": <json.RawMessage -> {
         "cardsByColumn": {
           "<ColumnName>": [
             {"id":"card_internal_5", "displayNumber": 5, "title":"T", "column":"QA"}, ...
           ],
           ...
         }
      }>
    }

DeleteCard:
- Topic: cmd.Kanban.DeleteCard.v1
- Payload sample (test expects):
  {
    "id": "card_xyz",
    "workspacePath": "/workspace"
  }

DeleteCardsInColumn (bulk):
- Topic: cmd.Kanban.DeleteCardsInColumn.v1
- Payload sample:
  {
    "column": "Unassigned",
    "count": 3,
    "workspacePath": "/workspace"
  }

UpdateCard:
- Topic: cmd.Kanban.UpdateCard.v1
- Payload sample:
  {
    "id": "card_abc123",
    "title": "Updated title",
    "description": "Updated desc",
    "workspacePath": "/workspace"
  }

MoveCard:
- Topic: cmd.Kanban.MoveCard.v1
- Payload sample:
  {
    "id": "hr2",
    "toColumn": "Done",
    "toLane": "<optional>",
    "toIndex": 0,
    "workspacePath": "/workspace"
  }

Agent lifecycle events:
- Topics: evt.Agent.RunStarted.v1, evt.Agent.RunProgress.v1, evt.Agent.MessageToUser.v1, evt.Agent.RunCompleted.v1
- Payloads: not exhaustively shown in the snippet; expect run metadata and human messages.

LLM output (structured expected):
- Single decision JSON:
  {"intent_type":"action","requested_action":"update_card","execution_ready":true,"confidence":1.0}
- Action arrays:
  [{"action":"delete_card","column":"QA","count":1}, {"action":"move_column","fromColumn":"A","toColumn":"B","count":0}]

Envelope conventions:
- Tests sometimes wrap published messages in a small envelope with `payload` or `correlationId`. Handler must be compatible with this convention.

---

## Design decisions and rationale {#handbook:appendix-c}

- Default to local Ollama gateway: Facilitates dev iteration and local LLM testing.
- LLM timeouts: Models can be slow; a long llmTimeout prevents premature cancellation for large prompts. However, llmConnectTimeout is shorter to detect configuration errors.
- Permissive JSON extraction: LLMs may produce JSON embedded in prose; extractJSONObject/All allow robust parsing. This makes the system tolerant to non-strict model outputs.
- Use NATS for inter-service commands: Lightweight, topic-based pub/sub fits the command/event patterns for Kanban interactions and agent lifecycle events, and enables easy testing via embedded NATS servers.
- Two-layer identifiers for cards (displayNumber vs internal id): The system supports user-facing references via display numbers and resolves them to backend IDs using GetBoard to keep the UI-friendly model while preserving backend consistency.
- Emitting run lifecycle events: Allows asynchronous UI feedback and monitoring of long-running agents.
- Testing via llmwatch mock: Allows deterministic unit/integration tests of complex decision flows without an external LLM.

---

## Troubleshooting / observability notes {#handbook:appendix-c}

- If agents do not appear to act:
  - Confirm Handler.llmURL and Handler.contextURL environment variables (LLM_GATEWAY_URL, CONTEXT_URL).
  - If using local Ollama, ensure it's running on 127.0.0.1:11434 or set LLM_GATEWAY_URL appropriately.
- If display numbers aren't being resolved:
  - Ensure cmd.Kanban.GetBoard.v1 responses are published on evt.Kanban.GetBoard.Result.v1 with matching correlationId and payload 'cardsByColumn' structure.
- If actions are not received by Kanban:
  - Ensure NATS connection (nc) in Handler is valid and publishes to topics exactly as expected (topic names are constants).
- Logs:
  - Handler uses storage.NewLogger for structured logging; consult the logs for debug messages about LLM calls (time/timeout), NATS publishes, and parsing errors.

---

## Testing & mocks (practical guide) {#handbook:appendix-c}

- To run handler tests locally:
  - Use natstest.RunRandClientPortServer() (used in tests) to spawn a test NATS server.
  - Use llmwatch.UseMock = true and llmwatch.RegisterMockResult("chat", <json>, "") to provide predictable LLM outputs.
  - Tests shown in cmd/pm/app/handler_test.go simulate the Kanban service by subscribing to cmd.Kanban.GetBoard.v1 and publishing evt.Kanban.GetBoard.Result.v1 responses.

Example flow (from tests):
1. Start NATS test server.
2. Connect nats.Connect(natsServer.ClientURL()).
3. Set llmwatch.UseMock = true and register mock responses.
4. NewHandler(storage.NewLogger(nil), nc) to create Handler.
5. Prepare subscribers to capture expected outputs (cmd.Kanban.UpdateCard.v1 etc).
6. Call h.executeChatIntent(...) (internal helper) or HandleAgentChatRequest(...) and assert expected behavior.

---

## Sequence (textual) — typical "update card by display number" run {#handbook:appendix-c}

1. UI or command bus publishes cmd.Agent.ChatRequest.v1 with payload containing AgentType="PM", message, optional cardID and history.
2. Some dispatcher passes the payload to cmd/pm/app.Handler.HandleAgentChatRequest(runID, corrID).
3. Handler constructs domain.ChatRequest and calls HandleChatRequest (which composes LLM prompt).
4. Handler optionally calls context service (contextURL) for NEED queries.
5. Handler calls LLM gateway (llmURL) with composed prompt; may timeout after llmConnectTimeout/llmTimeout if gateway is unreachable or slow.
6. LLM returns action JSON indicating requested_action:"update_card" and an id that may be a display reference (e.g., "HAL-0001").
7. Handler determines it needs to resolve display number -> internal id: publishes cmd.Kanban.GetBoard.v1 with correlationId.
8. Kanban service responds on evt.Kanban.GetBoard.Result.v1 with "cardsByColumn" mapping. Handler matches displayNumber to internal id.
9. Handler publishes cmd.Kanban.UpdateCard.v1 with payload {id: internal_id, title, description, workspacePath}.
10. Handler publishes evt.Agent.MessageToUser.v1 with final human-facing message "I've updated the ticket." and eventually evt.Agent.RunCompleted.v1.

---

## How to extend / add a new action {#handbook:appendix-c}

1. Add new action mapping in the Handler's intent-to-command resolution (e.g., map "assign_card" to cmd.Kanban.AssignCard.v1).
2. Define the corresponding NATS topic constant in handler.go and ensure the Kanban backend consumes it.
3. Update prompt templates / validation so the LLM can return structured JSON for the new action (decide on fields).
4. Add tests in cmd/pm/app/handler_test.go:
   - Register llmwatch mock response returning appropriate JSON.
   - Start a NATS test server.
   - Subscribe to the new command topic and assert payload fields.
   - Run executeChatIntent/HandleAgentChatRequest and assert expected user-facing messages and event emission.
5. Consider whether the action needs board state resolution (GetBoard request) and implement correlationId matching logic if necessary.

---

## Representative code references and snippets {#handbook:appendix-c}

- Handler construction:
  - cmd/pm/app/handler.go: NewHandler, NewHandlerWithWorkspace
    - Default llmURL:
      llmURL := os.Getenv("LLM_GATEWAY_URL")
      if llmURL == "" {
          llmURL = "http://127.0.0.1:11434"
      }
    - Default contextURL similar.

- Agent request routing:
  - cmd/pm/app/handler.go: HandleAgentChatRequest
    - Unmarshals AgentChatRequest and calls HandleChatRequest with ChatRequest.

- Constants controlling runtime:
  - llmTimeout := 300 * time.Second
  - llmConnectTimeout := 20 * time.Second
  - maxChatHistoryMessages := 12
  - minMessageWordsForContext := 3

- Example test patterns:
  - Use natstest.RunRandClientPortServer() to start NATS server.
  - Use nats.Connect to connect the Handler and to set up test subscribers.
  - Use llmwatch.UseMock and llmwatch.RegisterMockResult to supply LLM outputs.

---

## Summary {#handbook:appendix-c}

- Agents are instantiated via Handler in cmd/pm/app with configuration for LLM and context services.
- Incoming AgentChatRequest -> ChatRequest -> HandleChatRequest -> LLM call -> parse structured decision(s).
- Agents resolve user-friendly display references through GetBoard and then publish Kanban commands over NATS (UpdateCard, DeleteCard, DeleteCardsInColumn, MoveCard).
- Agents emit lifecycle events (evt.Agent.*) for UI/monitoring.
- Robust parsing, history recovery, retry/confirmation detection, and test mocking are built-in to ensure resilient multi-turn behavior.
- Tests in cmd/pm/app/handler_test.go provide a functional specification of expected behaviors and message shapes; they are the best reference for concrete examples and edge cases.

---

---

# Appendix D — Frontend & UI {#handbook:appendix-d}

> Focus: frontend architecture, state management, and API integration.

This appendix documents the HAL UI application located at `apps/ui/` and describes the runtime architecture, major components, state model and lifecycle, API surface used by the frontend, and the interaction patterns between the UI and backend services. File paths referenced are relative to the repository root.

---

## Table of contents {#handbook:appendix-d}

- Architecture overview
- Source layout and important files
- Application bootstrap and lifecycle
- State management
  - useAppData and boardState
  - reducer shape / actions
  - refs and derived state
- API surface and integration patterns
  - Primary endpoints and helper semantics (from `api.ts`)
  - Long-running requests, streaming, retries, aborts
- Server-Sent Events (SSE) and real-time updates
  - appSSEHandler
  - event dispatching → reducer → UI
- UI composition and component responsibilities
  - High-level layout (App.tsx)
  - Board and card workflows
  - Card detail, artifacts, and diffs
  - Chat, agents, and LLM watch flow
  - PM backend (llama.cpp) flow
- Key design decisions and rationale
- Testing strategy and mocking patterns
- Typical workflows (sequences)
  - Startup / workspace connect
  - Open card / read artifact
  - Send chat/agent command
  - Model pull / progress reporting
- Notes for maintainers / extension points

---

## Architecture overview {#handbook:appendix-d}

- The frontend is a single-page React + TypeScript application (Vite build), located at `apps/ui/`.
- It uses a centralized local state model exposed by a custom hook `useAppData` (see `apps/ui/src/useAppData.tsx`).
- UI receives authoritative board state via:
  - synchronous REST fetch for initial load (`fetchBoard` in `api.ts`), and
  - real-time updates via Server-Sent Events handled in `appSSEHandler.ts` and fed into the reducer in `boardState.ts`.
- Communication with backend services is performed via `apps/ui/src/api.ts`, which provides typed wrapper functions for kernel, LLM service, and QA service endpoints.
- UI components are reactive to state and to SSE-driven dispatches; side-effect invocations (commands) use `sendCommand` (wrapping `/api/command`).
- The UI is extensively tested with Vitest and React Testing Library (tests close to implementation in `apps/ui/src/**/*.test.tsx`).

---

## Source layout and important files {#handbook:appendix-d}

Key entrypoints & modules:

- apps/ui/src/
  - App.tsx — main application shell and high-level UI composition (header, board, footer, modals)
  - main.tsx — React DOM bootstrap (entry)
  - api.ts — network/HTTP client wrappers and typed API surface for kernel/LLM/QA
  - useAppData.tsx — primary UI state hook & API orchestration (returns state, dispatch-like handlers, refs)
  - boardState.ts — reducer and state transition logic for board model (actions, normalization)
  - appSSEHandler.ts — SSE connection management and event → dispatch translation
  - appUtils.ts — utility functions used across UI
  - appSSEHandler.test.ts — unit/integration tests for SSE handling
  - components/ — folder with all composable UI pieces (Board.tsx, CardDetail.tsx, ChatFooter.tsx, ArtifactReader.tsx, etc.)
  - autoTrigger.ts — helpers for UI-driven "Auto mode" that triggers agent runs
  - parseKernelBoard.ts / parseKernelBoard.test.ts — helpers for parsing server board payloads

Other files referenced in runtime:
- apps/ui/index.html — HTML template
- apps/ui/package.json, pnpm lockfiles — build/dev configuration
- apps/ui/src/*.test.tsx & components/*.test.tsx — automated tests exercising the UI behaviour and mocking api.ts

---

## Application bootstrap and lifecycle {#handbook:appendix-d}

1. Startup:
   - `main.tsx` mounts React and renders `<App />`.
   - `App.tsx` calls `useAppData()` to obtain the entire shared app model and handlers.
   - `useAppData` loads initial settings and attempts to fetch the active workspace (calls `fetchWorkspace()` from `api.ts`).
   - If a workspace is available, the UI invokes `fetchBoard(workspacePath)` for synchronous load and then connects to SSE for updates.

2. Realtime:
   - `appSSEHandler` (connected by `useAppData`) opens an SSE to `api.eventsURL()` (which is `KERNEL_URL/events`).
   - Incoming events are parsed and mapped to reducer actions implemented in `boardState.ts`.
   - The reducer updates normalized state (columns, cardsByColumn, activeWork, wip limits, correlation IDs, errors, etc.).

3. Interaction:
   - User actions (move card, create ticket, send chat) call action helpers returned by `useAppData`.
   - Helpers typically call `sendCommand` (POST /api/command) and update local pending correlation IDs and optimistic UI state.
   - The kernel will acknowledge and then SSE will carry authoritative updates back to the UI.

4. Background tasks:
   - The UI polls or requests endpoints for supplementary data: settings, LLM readiness, PM backend status.
   - Model pulls (OLlama/llama.cpp) are streamed using `pullLLMModel()` which handles NDJSON stream parsing.

---

## State management {#handbook:appendix-d}

### Principal hook: useAppData {#handbook:appendix-d}

- Path: apps/ui/src/useAppData.tsx
- Purpose: central entry point that wires together:
  - reducer defined in `boardState.ts`,
  - SSE handler (`appSSEHandler.ts`),
  - network API calls (`api.ts`),
  - derived refs and helper functions used by App.tsx and deep components.

What `useAppData` exposes (visible from App.tsx usage):
- state — canonical UI state (board, cards, loading/error/correlation metadata).
- workspace — current workspace record (path/consent).
- isWorkspaceConnected — convenience flag if workspace.path non-empty.
- fetchBoardRef — ref to function that fetches board synchronously (used to load or re-request).
- handlers exposed:
  - handleMoveCard (used by Board)
  - handleMoveRejectedConfirm
  - handleMessagesChange
  - handleClearHalHistory
  - handleError (centralized error handling that sets state.error and correlationId)
  - setWorkspace, setModalOpen, setDetailCard etc.
  - functions for LLM watch notifications and transcript handling
- agentProgress, llmWatchHistoryByCard etc.

Implementation notes:
- `useAppData` composes multiple React primitives:
  - useReducer(boardState.reducer, initialState)
  - useRef for stable refs (pendingAgentCorrRef, fetchBoardRef, boardStateRef)
  - useEffect for lifecycle (SSE connect, periodic polling for model/ready state, workspace persistence)
- Optimistic updates and pending correlation IDs:
  - When a command is sent (via `sendCommand`), `useAppData` stores pending correlation IDs per chat (e.g., `pendingAgentCorrRef.current["hal"] = correlationId`) then waits for authoritative SSE updates.
  - This pattern improves responsiveness but relies on SSE to reconcile state.

### Reducer & state shape {#handbook:appendix-d}

- Path: apps/ui/src/boardState.ts
- The reducer is responsible for:
  - managing normalized board model: columns[], activeWork[], cardsByColumn: Record<string, Card[]>
  - mapping server messages to local model updates (insert, update card, move, set WIP limits)
  - tracking global metadata: loading flags, correlationId for errors, last error string, wipEditable flag, wipLimits map, workspace snapshot
- Typical actions handled (derived from code use):
  - "SET_BOARD" / "RECEIVE_BOARD" — replace board state on full fetch
  - "UPDATE_CARD" / "UPSERT_CARD" — upsert single card
  - "MOVE_CARD_REQUEST" — optimistic local reposition (or just sending move command)
  - "MOVE_CARD_REJECTED" — show move rejected modal (App uses moveRejected state)
  - "SET_ERROR" / "CLEAR_ERROR" — error handling (App uses CLEAR_ERROR)
  - "SET_LOADING" / "SET_LOADING_FINISHED" — loading states
  - "LLM_WATCH_APPEND" / "LLM_WATCH_PERSISTED" — LLM watch history updates
  - "SET_CORRELATION" — set correlationId for last action

Design rationale:
- Central reducer keeps the UI consistent across components.
- Normalized storage (cardsByColumn) allows constant-time lookups for expensive operations (finding by id).
- Reducer is pure and limited to structural updates; side-effects (network) occur inside `useAppData` helpers.

### Refs & derived state {#handbook:appendix-d}

- boardStateRef — mutable ref to latest state used by background processes (e.g., auto-trigger tick).
- fetchBoardRef — ref to synchronous fetchBoard wrapper function that components and timers can call; ensures stable identity in useEffect dependencies.
- pendingAgentCorrRef — a persistent ref of outstanding agent/correlation ids keyed by chat or run; used to link command responses and SSE progress to UI chat state.
- hasAutoOpenedLLMLoading — in App.tsx to avoid repeatedly popping modal.

---

## API surface and integration patterns {#handbook:appendix-d}

All network requests are centralized in:
- apps/ui/src/api.ts

Key constants at top:
- KERNEL_URL = environment VITE_KERNEL_URL || "http://127.0.0.1:8080"
- LLM_URL = VITE_LLM_URL || "http://127.0.0.1:11434"
- QA_URL = VITE_QA_URL || "http://127.0.0.1:8091"

Primary function categories:

1. Commands
   - sendCommand(name: string, payload: object)
     - Builds a CommandEnvelope { name, version: 1, runId, correlationId, payload } and POSTs to `${KERNEL_URL}/api/command`.
     - Returns { runId, correlationId, ok, error }.
     - Used for all agent actions (PM.ChatRequest.v1, Kanban.* commands, LLM.StopModel.v1, etc.)

2. Initial synchronous fetches
   - fetchBoard(workspacePath: string)
     - GET `/api/board?workspacePath=...` with 15s abort timeout.
     - Used to populate initial UI synchronously (bypasses SSE).
   - fetchWorkspace(), postWorkspace()
     - Workspace discovery and saving (with defensive timeouts and user-friendly errors if kernel unreachable).

3. Settings and model metadata
   - fetchSettings(), fetchSettingsWithRetry()
   - fetchModelTiers(), fetchModelStats(), fetchLLMQueueStatus()

4. LLM / PM backend status and control
   - fetchLLMReady(), fetchPmBackend(), setPmBackend()
   - fetchLLMRequiredModels(), fetchLLMInstalledModels(), fetchLLMLoadedModels()
   - pullLLMModel(model, onProgress, signal)
     - Streams NDJSON progress from `/api/llm-pull` and calls onProgress for each parsed JSON event.
   - deleteLLMModel()

5. Artifacts and QA
   - fetchArtifact(runId, path, workspacePath?)
   - artifactURL(runId, path, workspacePath?) — convenience url for direct navigation
   - fetchTicketRunIds(cardId), fetchRunManifest(runId), fetchTranscripts(cardId)
   - fetchProposals(), approveProposal(), rejectProposal()
   - replayTranscript, replayCompare, fetchCompareDiffs

6. Streaming events URL
   - eventsURL(): string (used by SSE handler).

Network design patterns used by api.ts:
- Defensive: functions often return safe defaults on HTTP/network failure rather than throwing (e.g., fetchModelTiers returns empty structures).
- Timeouts / AbortController: used for workspace and board fetches to fail fast with helpful messages.
- Streaming parsing: `pullLLMModel` uses ReadableStream.getReader() and TextDecoder, splits by newline, JSON.parse each NDJSON payload.
- Semantics: `sendCommand` returns a 202 acceptance; `ok` is true only if server returned 202. Errors are parsed from body when possible.

Examples of usage:
- App.tsx uses sendCommand to initiate PM.ChatRequest.v1 (and stores returned correlationId in pendingAgentCorrRef).
- ArtifactReader uses `fetchArtifact` to retrieve run artifact contents.
- Model modals call fetchLLMRequiredModels/pullLLMModel to trigger model pulls and show progress.

---

## Server-Sent Events (SSE) and real-time updates {#handbook:appendix-d}

- Implementation: apps/ui/src/appSSEHandler.ts
  - Connects to the kernel SSE endpoint returned by `api.eventsURL()` (likely `/events` on the kernel).
  - Handles reconnection, error handling, and maps incoming events into application actions.
  - A small event translation layer maps kernel event types into the local reducer actions expected by `boardState`.

- Expected event flow:
  - Board-level events (e.g., board snapshot changed, card added or updated)
  - Agent events (agent progress, logs, final result)
  - LLM Watch / transcript events
  - PM backend status updates
  - Error and correlation events (allowing mapping of error messages to correlation IDs in UI)

- appSSEHandler responsibilities:
  - Robust reconnection backoff (to tolerate transient kernel disconnects).
  - Filtering / dedup of events (e.g., avoid duplicate board apply).
  - Calling dispatch functions provided by `useAppData` to update state.

- Integration pattern:
  - `useAppData` creates the dispatch function (reducer).
  - `appSSEHandler` receives an instance of that dispatch (or callbacks such as `onBoardPatch`) and translates SSE events into dispatch calls.

---

## UI composition and component responsibilities {#handbook:appendix-d}

High-level file: apps/ui/src/App.tsx

- App.tsx composes the entire application using `useAppData()`:
  - AppHeader — top-level header with mode switches and workspace picker
  - Board — main Kanban component (renders columns and cards)
  - CardDetail — modal / side panel for editing and viewing a card (and attachments/transcripts)
  - ChatFooter — chat UI for assistant/PM/agent interactions
  - Various modals: NewTicketModal, ModelSettingsModal, PaidSettingsModal, MoveRejectedModal, ProposalsModal, LLMWatchModal, LLMLoadingModal
  - LlamaCppProgressOverlay — displays PM backend progress

Selected components and responsibilities:

- Board (apps/ui/src/Board.tsx)
  - Renders columns from `state.columns` and cards from `state.cardsByColumn`.
  - Delegates drag/move events to `onMoveCard` handler supplied by `useAppData`.

- CardDetail (apps/ui/src/CardDetail.tsx)
  - Shows all card fields, sections (CardDetailForm*), transcripts, run artifacts.
  - Calls API helpers (via props in App.tsx e.g., fetchBoardRef.current on save).

- ArtifactReader (apps/ui/src/components/ArtifactReader.tsx)
  - Responsible for:
    - Loading file contents for a particular iteration using `fetchArtifact`.
    - Rendering artifact text in a modal (monospace `<pre>` for non-markdown files).
    - Showing modal overlay; supports multiple iterations (tab bar shows "Run 1", "Run 2", ...).
  - Tests in `ArtifactReader.test.tsx` verify content loading, tab switching, and overlay close actions.

- ChatFooter & ChatPanel components (apps/ui/src/components/*)
  - Manage message lists and composing messages for assistant/chat.
  - When user sends a message, App.tsx calls sendCommand("PM.ChatRequest.v1") and stores the correlation id as pending.
  - SSE events update the chat with streamed progress and final responses.

- LLM Watch Modal (`LLMWatchModal.tsx`)
  - Shows non-streaming persisted watches (fetched via `fetchLLMWatches(cardId)`) and in-memory live watches from SSE (llmWatchHistoryByCard).
  - Allows stopping model execution via `sendCommand("LLM.StopModel.v1", { runId, model })`.

- Model settings and PM backend modals
  - ModelSettingsModal, PaidSettingsModal — call `postSettings` and `fetchSettingsWithRetry`.
  - LlamaCppProgressOverlay displays `PmBackendStatus` from `fetchPmBackend()` and calls `setPmBackend()`.

---

## Key design decisions & rationale {#handbook:appendix-d}

1. Single source of truth (reducer):
   - The boardReducer serves as the canonical model for rendering across components.
   - SSE events are considered authoritative; UI commands are optimistic but reconciled with SSE.

2. Centralized network layer (`api.ts`):
   - All network interactions go through `api.ts` to provide consistent error handling, timeouts, and typed interfaces.
   - This simplifies testing; tests mock `api.*` functions (see tests).

3. Long-running operation handling:
   - Streaming (NDJSON) is handled in dedicated functions:
     - `pullLLMModel` parses NDJSON for model pull progress and supplies a callback: avoids mixing streaming logic into components.
   - SSE is handled in a single module `appSSEHandler` to isolate reconnection and parsing logic from UI.

4. Optimistic UX with explicit pending correlation mapping:
   - Commands return correlation IDs; pendingAgentCorrRef and pendingCorrelationIdByChat map UI operations to kernel-side processing.
   - This allows the UI to present pending states (e.g., show agentProgress in ChatFooter) even before SSE arrives.

5. Defensive network behavior:
   - Many `api.ts` functions return neutral defaults instead of throwing to avoid one failing minor endpoint from breaking the whole UI.
   - `fetchSettingsWithRetry` shows how to tolerate transient service startup latencies.

6. Separation of concerns:
   - Presentation and interaction logic are in components; side-effects and business logic are in `useAppData` and `api.ts`. Reducer focuses only on deterministic state transitions.

---

## Testing strategy and mocking {#handbook:appendix-d}

- Test runner: Vitest (see `apps/ui/package.json` & `*.test.tsx` files).
- Unit tests focus on:
  - Component rendering and behavior (`ArtifactReader.test.tsx`, `Board.test.tsx`, `CardDetail.test.tsx`, etc.)
  - Utility functionality (`parseKernelBoard.test.ts`, `appSSEHandler.test.ts`, `boardState.test.ts`).
- Common mocking patterns:
  - `vi.mock("../api", () => ({ fetchArtifact: vi.fn() }))` — component tests mock `api.ts` functions to control responses and streaming behavior.
  - SSE tests mock `EventSource` behavior or emulate event dispatches by invoking handler functions directly.
- Integration tests:
  - Playwright e2e config exists under `apps/ui/e2e/` (e.g., `kanban.spec.ts`) for higher-level flows.

---

## Typical workflows (detailed sequences) {#handbook:appendix-d}

Below are representative sequences that describe how pieces interact at runtime.

### Startup / workspace connect {#handbook:appendix-d}

1. `App.tsx` mounts and calls `useAppData()`.
2. `useAppData` calls `fetchWorkspace()` via `api.ts`.
   - If `workspace.path` is empty → show `WorkspaceModal`.
3. If workspace is present:
   - Call `fetchBoard(workspace.path)` (sync board).
   - Connect SSE via `appSSEHandler` to receive incremental updates.
4. `App.tsx` renders `Board` with `state` returned by `useAppData`.

Files to inspect:
- apps/ui/src/App.tsx
- apps/ui/src/useAppData.tsx
- apps/ui/src/api.ts
- apps/ui/src/appSSEHandler.ts

### Open card / read artifact (ArtifactReader flow) {#handbook:appendix-d}

1. User opens a card; App sets `detailCard` (via setDetailCard from useAppData).
2. CardDetail shows artifact list and when user clicks an artifact, `ArtifactReader` is mounted.
3. `ArtifactReader` calls `fetchArtifact(runId, path, workspacePath)` (api.ts):
   - This performs GET `/api/run-artifact?...`.
   - On success: sets `content` state and renders it in the modal body.

Files to inspect:
- apps/ui/src/components/ArtifactReader.tsx
- apps/ui/src/api.ts

### Send chat/agent command (PM.ChatRequest.v1 flow) {#handbook:appendix-d}

1. User composes message in `ChatFooter` and sends.
2. `App.tsx` or `useAppData` calls `sendCommand("PM.ChatRequest.v1", { message, workspacePath, context, history })`.
3. `sendCommand`:
   - Generates runId and correlationId.
   - POSTs CommandEnvelope to `/api/command`.
   - Returns { runId, correlationId, ok, error }.
4. UI stores pending correlation: `pendingAgentCorrRef.current["hal"] = correlationId` and sets pending UI state (spinner/queue position).
5. Kernel processes the command, starts agent or LLM run. It publishes progress and results to SSE (or to transcripts service).
6. `appSSEHandler` receives events and dispatches:
   - Agent progress → `agentProgress` in state (ChatFooter consumes and displays).
   - Final response → `messagesByChat` update or `chatResponse` and `chatCorrelationId`.
7. UI clears pending state when SSE indicates completion (or on explicit cancel call using `sendCommand("LLM.StopModel.v1", ...)`).

Files to inspect:
- apps/ui/src/api.ts (sendCommand)
- apps/ui/src/App.tsx (how App wires sendCommand)
- apps/ui/src/appSSEHandler.ts (SSE → reducer translation)
- apps/ui/src/useAppData.tsx (pendingCorrRef handling)

### Model pull / progress reporting (pullLLMModel flow) {#handbook:appendix-d}

1. User requests model pull (ModelSettingsModal or Llama UI).
2. UI calls `pullLLMModel(model, onProgress, signal)` from `api.ts`.
3. `pullLLMModel`:
   - POST to `/api/llm-pull` and reads NDJSON stream.
   - For each JSON event line, calls onProgress(ev).
4. Component's onProgress updates UI with phases and percent.
5. If request is aborted (signal), the model pull is canceled.

Files to inspect:
- apps/ui/src/api.ts (pullLLMModel)
- apps/ui/src/components/ModelSettingsModal.tsx
- apps/ui/src/components/LlamaCppProgressOverlay.tsx

---

## Notes for maintainers / extension points {#handbook:appendix-d}

- Centralized API (`api.ts`) makes it straightforward to:
  - Add endpoints and type responses.
  - Replace fetch with an alternative (fetch wrapper/axios) in one place, including retry/backoff behavior.

- SSE & Event mapping:
  - `appSSEHandler` abstracts reconnection, parsing and debouncing; if additional event types are added on the kernel side, map them into existing reducer actions or add new actions in `boardState.ts`.

- State normalization:
  - The reducer keeps cards normalized by column; this allows efficient card lookups without scanning arrays.
  - If adding global indices (e.g., runId → card mapping), extend reducer normalization logic.

- Tests:
  - Component tests commonly mock `api.ts`. To test new API flows, add unit tests that `vi.mock` the expected `api` function and assert UI behavior.

- Long-running streaming:
  - `pullLLMModel` demonstrates robust NDJSON streaming parsing; reuse this pattern for other NDJSON streams.

- Error handling:
  - `postWorkspace` and `fetchWorkspace` implement user-friendly translated messages for common failure modes (kernel not running). Follow this pattern for new endpoints that are critical for first-run UX.

---

## Quick file reference (paths) {#handbook:appendix-d}

- Entry & app shell:
  - apps/ui/src/main.tsx
  - apps/ui/src/App.tsx
  - apps/ui/src/AppHeader.tsx

- State & SSE:
  - apps/ui/src/useAppData.tsx
  - apps/ui/src/boardState.ts
  - apps/ui/src/appSSEHandler.ts
  - apps/ui/src/boardState.test.ts
  - apps/ui/src/appSSEHandler.test.ts

- API layer:
  - apps/ui/src/api.ts

- Components (high-impact):
  - apps/ui/src/Board.tsx
  - apps/ui/src/CardDetail.tsx
  - apps/ui/src/NewTicketModal.tsx
  - apps/ui/src/components/ArtifactReader.tsx
  - apps/ui/src/components/ChatFooter.tsx
  - apps/ui/src/components/LLMWatchModal.tsx
  - apps/ui/src/components/ModelSettingsModal.tsx
  - apps/ui/src/components/LlamaCppProgressOverlay.tsx

- Utilities:
  - apps/ui/src/appUtils.ts
  - apps/ui/src/autoTrigger.ts
  - apps/ui/src/parseKernelBoard.ts

- Tests:
  - apps/ui/src/**/*.test.tsx

---

## Closing notes {#handbook:appendix-d}

- The frontend is deliberately structured to separate deterministic state (reducer) from side effects (useAppData + api.ts), and real-time ingestion (SSE) is isolated for reliability and reconnection behavior.
- When adding new agent types, transcript formats, or artifact types, add:
  - API contracts in `api.ts` (and tests),
  - event parsing in `appSSEHandler.ts`,
  - reducer actions in `boardState.ts`,
  - and UI consumers in components (keeping presentational logic and side-effects separated).

End of Appendix D.

---

# Appendix E: Configuration & Deployment {#handbook:appendix-e}
Focus: hardware detection, LLM settings, and deployment configuration. The sections below map the code, describe design decisions, and provide concrete deployment/workflow guidance.

---

## Table of contents {#handbook:appendix-e}
- Components & file map
- Hardware detection: design, algorithm, caching, code references
- Local/hybrid/hosted settings: schema, normalization & migration, model selection helpers
- Settings persistence: store location, atomic writes, concurrency, and normalization on load
- Path resolution & environment variables: halpaths rules and migration
- Deployment checklist and recommended workflows
- Testing notes and expected behaviors

---

## Components & file map (relevant files) {#handbook:appendix-e}
- Settings and LLM storage
  - cmd/llm/storage/settings.go — Settings types, ProviderDefs, LocalModelConfig unmarshalling, SettingsStore (load/save/get).
- Entrypoint (service runner)
  - cmd/hal/main.go — `hal serve <service>` dispatcher.
- Path resolution and migration
  - internal/halpaths/paths.go — ResolveInstallDataRoot, ResolveDataRoot, EnsureProjectDataRoot, migration from home, ResolveRunsRoot*, migration marker.
  - internal/halpaths/paths_test.go — tests that validate environment interactions, migration and path resolution.
- Hardware detection
  - internal/hwdetect/hwdetect.go — detection implementation: GPU, system RAM, classification, tier defaults, cache.
  - internal/hwdetect/hwdetect_test.go — unit tests for classification and defaults.

---

## Hardware detection {#handbook:appendix-e}

### Purpose {#handbook:appendix-e}
The hardware detection subsystem determines appropriate local LLM defaults by probing:
- discrete GPU presence and VRAM (via `nvidia-smi`),
- platform-specific total system memory (via `free`, `sysctl`, or `wmic`),
- Apple Silicon unified memory detection,
and computes a single "usable memory" metric that is used to classify a tier (1–4). The tier maps to conservative default local model assignments.

Primary file: `internal/hwdetect/hwdetect.go`.

### Key functions and behavior {#handbook:appendix-e}
- Detect() HardwareInfo
  - Calls detectSystemRAM() to get system RAM (GB).
  - If on macOS (`runtime.GOOS == "darwin"`) and isAppleSilicon() returns true:
    - Sets `UnifiedMemory = true`
    - `UsableMemoryGB = SystemRAMGB` (unified memory is treated as fully usable)
    - `GPUName = "Apple Silicon (unified)"`
  - Otherwise:
    - Runs detectNvidiaGPU() to populate `GPUName` and `VRAMGB`.
    - If GPU VRAM > 0: `UsableMemoryGB = VRAM + SystemRAMGB`
    - Else: `UsableMemoryGB = SystemRAMGB * 0.5` (conservative fallback)
  - Sets `Tier` and `TierLabel` using ClassifyTier(usableGB).
  - Returns populated `HardwareInfo`.

- detectNvidiaGPU()
  - Executes `nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits`.
  - Parses first line: GPU name and memory in MB -> VRAMGB = MB / 1024.
  - If `nvidia-smi` missing or output invalid => returns zero-valued `gpuInfo`.

- detectSystemRAM()
  - macOS: `sysctl -n hw.memsize` => bytes -> GB.
  - Windows: `wmic OS get TotalVisibleMemorySize /format:csv` -> reports KB -> GB.
  - Linux/other: `free -b` -> parse the `Mem:` line, field[1] -> bytes -> GB.
  - On error, returns 0.

- isAppleSilicon()
  - Attempts `sysctl -n machdep.cpu.brand_string` and checks lowercased string for "apple".
  - If sysctl fails: falls back to `runtime.GOARCH == "arm64"`.

- ClassifyTier(usableGB float64) -> (tier int, label string)
  - usable < 12: tier 1 ("8GB or less")
  - 12 <= usable < 24: tier 2 ("12-16GB")
  - 24 <= usable < 48: tier 3 ("24-32GB")
  - >= 48: tier 4 ("48GB+")

- DefaultsForTier(tier int) -> TierDefaults
  - Returns a conservative mapping of per-role default local models (codingFast, codingMid, codingFull, general, embedding, simpleTask) and NumCtx (context window size) keyed by tier.
  - Tier 1 uses smallest supported local model for all coding positions; tiers 2–4 introduce escalation ladders.

### Caching {#handbook:appendix-e}
- Cache location: `CachePath()` returns `<homedir>/.hal/hardware.json`.
  - Home via os.UserHomeDir(); fallback `.`.
- Persistence:
  - HardwareInfo.Save() writes JSON to `CachePath()` with dir created (`0755`) and file mode `0644`.
  - LoadCached() reads `CachePath()` and returns (HardwareInfo, true) if present and valid; otherwise returns zero value and false.
  - DetectAndCache() runs Detect(), then Save(), returns the HardwareInfo.

Design notes:
- Usable memory uses GPU VRAM addition if VRAM detected; otherwise uses half the system RAM — this biases toward requiring discrete GPU for larger models.
- Unified memory on Apple Silicon uses the entire addressable unified memory (fits current macOS practice for GPU-like usage).
- Thresholds are conservative; unit tests exist in `internal/hwdetect/hwdetect_test.go` validating classification and default mappings.

### Human-readable {#handbook:appendix-e}
- HardwareInfo.String() provides a summarizing string "Tier N (label): GPU=..., VRAM=...GB, RAM=...GB, usable=...GB, unified=..."

---

## Settings: schema, normalization, and helpers {#handbook:appendix-e}

Primary file: `cmd/llm/storage/settings.go`.

### Settings schema (structs) {#handbook:appendix-e}
- ProviderDefs (in-memory constant) — supported hosted providers and default ModelIDs. Example entry:
  - `"openai": {BaseURL: "https://api.openai.com/v1", ModelIDs: [...]}`.
- ProviderConfig
  - ID string
  - APIKey string `apiKey` (optional — stripped in public Get())
  - BaseURL string (override)
  - ApprovedModels []string (hosted-mode filter)
- LocalModelConfig
  - CodingFast/CodingMid/CodingFull/General/Embedding/SimpleTask []string
  - NumCtx int
  - ExcludedByRole map[string][]string
  - TierOverrides map[string]map[string]string
  - UnmarshalJSON accepts legacy formats (single string or []string) and migrates `summarization` -> `simpleTask`.
- HostedModelConfig
  - CodingFull, General, Embedding, SimpleTask strings, Summarization (deprecated)
  - TierOverrides map[string]map[string]string
  - UnmarshalJSON migrates summarization into SimpleTask and copies overrides with alias handling.
- HardwareDetection
  - Tier int, TierLabel string, GPUName string, UsableMemoryGB float64 (a compact subset of `internal/hwdetect.HardwareInfo`).
- Settings
  - Mode string — one of ModeLocal, ModeHosted, ModeDemo (legacy mapping), ModeComposite.
  - Providers []ProviderConfig
  - Hardware *HardwareDetection (cached detection result)
  - Local *LocalModelConfig
  - Hosted *HostedModelConfig
  - PMBackend string — "ollama" (default) or "llamacpp".

### Mode constants {#handbook:appendix-e}
- ModeLocal = "local" (Ollama only)
- ModeHosted = "hosted" (hosted providers using API keys)
- ModeDemo = "demo" (legacy)
- ModeComposite = "composite" (local+hosted racing)

Antikythera demo mode:
- Controlled by env var `ANTIKYTHERA_DEMO_MODE=1`.
- Special locked hosted config: `AntikytheraHostedConfig()` returns exactly three approved model IDs (hardcoded).
- `AntikytheraLadder()` returns the escalation ladder (mini-only).

### Local model normalization and aliases {#handbook:appendix-e}
- `normalizeModelListForRole(role, v interface{}) []string` accepts nil, string, []string, []interface{} and converts to normalized []string. Normalization includes:
  - Trimming whitespace.
  - Applying `localModelAliases` mapping (e.g., "nomic-embed-code" -> "qwen3-embedding:4b").
  - Filtering retired models by role using `retiredLocalModelsByRole` (declared at top of file).
  - Deduplicating while preserving order.
  - If resulting list is empty -> returns nil.

- `localModelAliases` and `retiredLocalModelsByRole` are centralized mappings to:
  - Migrate deprecated model names to current canonical IDs.
  - Remove retired models from candidate lists based on role (e.g., coding/general/embedding).

- Helpers:
  - `ExplicitLocalModels(s Settings) []string` — returns union of explicitly saved local models (ignores env-driven or hardware-default fallback).
  - `LocalModelsForPrefetch(s Settings, starterModel string) []string` — proactive download list: prefer explicit saved local models; otherwise, use the starter model (alias-mapped).
  - `LocalStartupEmbeddingModel(s Settings) string` — returns first local embedding model if explicitly set (used to permit startup-only embedding load).
  - `firstModel`, `cloneModelList`, `explicitLocalModelList` used internally.

- Tier overrides
  - `TierOverrides` fields accept map[role][modelID]tier string.
  - `copyTierOverrides` also applies alias mapping and filters out retired models.

### Provider summary and settings summary functions {#handbook:appendix-e}
- `summaryProviders`, `summaryLocal`, `summaryHosted`, `summarySettings` produce compact human-readable strings used in logs.
- `SettingsSummary(s *Settings) string` wraps `summarySettings`.

Design decisions:
- Unmarshal logic supports legacy JSON shapes (single string vs list) for backward compatibility.
- Alias mapping centralizes renaming rules; upgrades can be performed without changing user files.
- Retirement lists are role-specific to prevent selecting unsupported models for certain roles.
- Settings.Get() intentionally strips APIKey values for public or UI usage; GetWithKeys() returns full copy for internal use only.

---

## Settings persistence and store behavior {#handbook:appendix-e}

Primary type: `SettingsStore` (in `cmd/llm/storage/settings.go`).

### Store lifecycle {#handbook:appendix-e}
- Creation: `NewSettingsStore() *SettingsStore`
  - Prioritizes directories in this order:
    1. `HAL_INSTALL_CONFIG_DIR` env -> `<HAL_INSTALL_CONFIG_DIR>/llm`
    2. `halpaths.ResolveInstallDataRoot()` -> `<installRoot>/llm`
    3. `HAL_CONFIG_DIR` env or `HAL_DATA_ROOT` env or `halpaths.ResolveDataRoot()` or cwd fallback -> `<root>/llm`
  - Ensures directory exists (`os.MkdirAll(dir, 0755)`).
  - Path is `<dir>/settings.json`.
  - Default in-memory settings: `&Settings{Mode: ModeComposite, Providers: nil}`.

- Path method: `Path() string` exposes where settings are persisted.

- Loading: `(*SettingsStore).Load() error`
  - Acquires write lock (`ss.mu.Lock()`).
  - Calls `loadFromDiskLocked()` which:
    - Reads file bytes and `json.Unmarshal` to `Settings`.
    - Migrates legacy `free` -> `local`, `paid` -> `hosted`.
    - Migrates `demo` -> `composite`.
  - On successful load, Store normalizes JSON using `json.MarshalIndent` and overwrites file atomically if normalized bytes differ:
    - Writes to tmp `<path>.tmp` with mode `0600`, then `os.Rename` to replace file.
  - Logging: logs load path and summary via `summarySettings`.
  - If file missing: returns nil and uses in-memory default.

- Saving: `(*SettingsStore).Save(s *Settings) error`
  - Acquires write lock.
  - Marshals `s` with indentation and writes atomically: write to `path.tmp` (mode `0600`) and rename to final path (ensures atomic replacement).
  - On rename failure removes tmp.
  - Updates in-memory `ss.s` to new settings.
  - Logs status and bytes.

- `Get()` (public-facing) returns a copy of settings with keys redacted: providers have `APIKey` omitted.
- `GetWithKeys()` returns deep copy including API keys (internal use).
- Concurrency: `ss.mu` protects `s` and file operations. Save & Load use the same lock to prevent races.

Design notes:
- Atomic JSON replace via tmp+rename prevents partial writes and supports other processes reading stable files.
- Temp files are created with 0600 to ensure keys are not world-readable during the write.
- On load, any normalizing modifications (reformatting, migration) are applied and persisted back so upgrades are durable and consistent.

---

## Path resolution, environment variables, and home -> project migration {#handbook:appendix-e}

Primary file: `internal/halpaths/paths.go`.

### Path resolution rules {#handbook:appendix-e}
- ResolveInstallDataRoot()
  - Uses `rulebook.DiscoverHALRoot()` to find repository root by walking up from the executable.
  - If `<repo>/.ae` exists -> returns that; otherwise `<repo>/.hal`.
  - If no repo => returns `""`.

- OpenAIKeyFromEnvOrInstall()
  - Precedence:
    1. `LLM_API_KEY`
    2. `OPENAI_API_KEY`
    3. `HAL_DEMO_OPENAI_KEY`
    4. `<installRoot>/openai_api_key` first line (if installRoot exists)
  - Ensures install-provided key is used when env not set (important for install-root-controlled keys).

- ResolveDataRoot()
  - Precedence:
    1. `AE_DATA_ROOT`
    2. `HAL_DATA_ROOT`
    3. Walk up from cwd and prefer `.ae` over `.hal`, returning first match.
  - If none found -> returns `""`. The engine requires to be connected to a workspace to save project-scoped data.

- ResolveTicketsRoot()
  - `HAL_TRANSCRIPTS_ROOT` -> else `<dataRoot>/tickets`

- ResolveRunsRoot(), ResolveRunsRootForWorkspace(workspaceRoot)
  - `RUNS_ROOT` (non-workspace-aware)
  - `ResolveRunsRootForWorkspace` uses `<workspace>/.ae/runs` or `<workspace>/.hal/runs` based on presence of `.ae` in workspace; falls back to ResolveRunsRoot() when workspaceRoot is empty.

### EnsureProjectDataRoot() and migration {#handbook:appendix-e}
- Called at binary startup in `cmd/hal/main.go`:
  - Ensures a project-local data root exists under WORKSPACE_ROOT (or cwd) as `.ae` by default (or `.hal` preserved if present).
  - Sets environment variables when missing: `AE_DATA_ROOT`, `HAL_DATA_ROOT`, `KANBAN_DB_PATH`, `AE_CONFIG_DIR`, `HAL_CONFIG_DIR`.
  - Performs one-time migration from user's home-level `.ae` or `.hal` into project data root if project data is empty:
    - Migration marker: `<projectDataRoot>/.migrations/home-import-v1.done` — presence prevents repeat.
    - Copies `tickets`, `runs`, `kanban`, `llm` trees into project data root only when:
      - Home data root exists and is distinct from project root.
      - Project has no existing data (checked via `projectHasData`).
  - copyTree uses `filepath.Walk` while preserving file mode.

Design implications:
- Settings store path (in `NewSettingsStore`) prefers `HAL_INSTALL_CONFIG_DIR` to ensure install-provided keys and settings are used first.
- The one-time migration preserves existing project configuration over home-level configuration.

---

## Deployment configuration & environment variables {#handbook:appendix-e}

Critical environment variables and their roles (precedence order when applicable):

- HAL_INSTALL_CONFIG_DIR
  - If set: used as the install-level configuration root. Settings store path becomes `<HAL_INSTALL_CONFIG_DIR>/llm/settings.json`.
  - Useful for deployments where installation configuration (API keys) must be centrally managed.

- AE_DATA_ROOT / HAL_DATA_ROOT
  - Project data root. If not set, engine walks up from cwd to find `.ae` or `.hal`.
  - Must be set for headless server deployments where working directory discovery is unsuitable.

- WORKSPACE_ROOT
  - Used by EnsureProjectDataRoot when present to locate project workspace.

- HAL_CONFIG_DIR / AE_CONFIG_DIR
  - Alternate envs used by EnsureProjectDataRoot to set paths if missing.

- KANBAN_DB_PATH
  - Defaults to `<dataRoot>/kanban/kanban.db` if unset. Useful for controlling where kanban SQLite DB is stored.

- RUNS_ROOT / HAL_TRANSCRIPTS_ROOT
  - Override paths for runs or transcripts storage.

- LLM_API_KEY, OPENAI_API_KEY, HAL_DEMO_OPENAI_KEY
  - Ordered precedence in OpenAIKeyFromEnvOrInstall().

- ANTIKYTHERA_DEMO_MODE
  - When set to `1`, the system forces Antikythera demo mode, locking hosted model lists to known IDs, preventing other hosted model usage.

Deployment considerations:
- Permission model:
  - Settings files are written with node-specific permissions:
    - Settings writes tmp file with `0600` then rename to `settings.json`. Ensure the service user has permission to write the config dir.
  - Hardware cache: `~/.hal/hardware.json` written with `0644` by default. Consider `umask` or directory permissions if this contains sensitive data.
- SELinux/AppArmor: Ensure policy allows execution of probes (`nvidia-smi`, `free`, `sysctl`, `wmic`) from the service user. Detection returns conservative defaults on failures.
- nvidia-smi dependency:
  - For VRAM detection, `nvidia-smi` must be on PATH and accessible. If not present, GPU detection returns empty and usable memory uses the 50% RAM heuristic.
- Windows:
  - For Windows deployments, `wmic` must be available; otherwise detectSystemRAM returns 0.
- macOS:
  - For Apple Silicon, `sysctl` introspection is used and unified memory is detected and treated as fully usable.

Sample systemd service (recommended approach):
- Create a system user and group (e.g., `hal`).
- Ensure `AE_DATA_ROOT` or `WORKSPACE_ROOT` set in the service environment (or run the service from a checked-out repo with `.ae`).
- Example unit fragment (replace placeholders):
  ```
  [Unit]
  Description=HAL LLM service
  After=network.target

  [Service]
  User=hal
  Group=hal
  Environment=AE_DATA_ROOT=/srv/hal/project/.ae
  ExecStart=/usr/local/bin/hal serve llm
  Restart=on-failure
  ```
- Ensure config dir (`/srv/hal/project/.ae/llm`) is owned by `hal` and writable.

Security guidance:
- Keep API keys out of world-readable files. Settings save uses 0600 during write; ensure the final settings.json location has appropriate permissions.
- Prefer setting provider API keys via install-level files controlled by operators using `HAL_INSTALL_CONFIG_DIR` to avoid storing sensitive keys in project repositories.

---

## Runtime workflows & recommended hooks {#handbook:appendix-e}

Suggested initialization sequence for a service node (e.g., LLM local host service):

1. Ensure project or install env variables:
   - Set `HAL_INSTALL_CONFIG_DIR` if install-level keys should be used (e.g., `/etc/hal` or `/opt/hal/.ae`).
   - Or set `AE_DATA_ROOT` / `HAL_DATA_ROOT` / `WORKSPACE_ROOT` if running in project context.

2. Run EnsureProjectDataRoot on binary startup:
   - Already invoked in `cmd/hal/main.go` via `halpaths.EnsureProjectDataRoot()`.

3. Settings store initialization:
   - `NewSettingsStore()` will pick a path and create `<dir>/settings.json` if required.

4. Hardware detection:
   - Call `internal/hwdetect.DetectAndCache()` early in service lifecycle (LLM/pm processes) to cache detection results to `~/.hal/hardware.json`.
   - Populate `Settings.Hardware` from detected values for use when computing model defaults:
     - Many components expect settings to contain `Hardware` (see Settings.Hardware). If a component depends on hardware-based defaults and the store lacks `Hardware`, call DetectAndCache and then update settings via Save().

5. Model prefetching and downloads:
   - Use `LocalModelsForPrefetch(s, starterModel)` to derive proactive downloads (explicit user-local models preferred; otherwise the provided starter model).
   - Use `LocalStartupEmbeddingModel(s)` to decide whether to download an embedding-only model on startup.

6. PM backend selection:
   - PM backends: `ollama` (default) or `llamacpp`.
   - Set via `Settings.PMBackend` and persist with `SettingsStore.SetPMBackend(backend)`.

7. Handling demo mode:
   - If `ANTIKYTHERA_DEMO_MODE=1`:
     - `IsAntikytheraDemo()` returns true, and hosted model resolution must be short-circuited to the three approved IDs. Use `AntikytheraHostedConfig()` and `AntikytheraLadder()` when building model resolution pipelines.

8. Updating settings from UI/API:
   - When UI modifies settings, use `SettingsStore.Save()` to persist.
   - For UI/public endpoints, use `SettingsStore.Get()` to avoid leaking API keys.

Notes on automatic JSON normalization:
- On load, settings are normalized with `json.MarshalIndent` and written back if the normalized form differs; ensures canonical JSON formatting and auto-upgrades legacy fields.

---

## Tests & expected behaviors {#handbook:appendix-e}

- Hardware detection tests (`internal/hwdetect/hwdetect_test.go`):
  - `ClassifyTier` boundary behaviors and labels checked thoroughly.
  - `DefaultsForTier` validated that tier-1 returns identical coding model for all coding positions (fast/mid/full same), that NumCtx expectations are met, and out-of-range tiers fall back to tier 4 defaults.

- Path resolution tests (`internal/halpaths/paths_test.go`):
  - `EnsureProjectDataRoot` populates `AE_DATA_ROOT`, `HAL_DATA_ROOT`, `AE_CONFIG_DIR`, `HAL_CONFIG_DIR`, and `KANBAN_DB_PATH` with expected values.
  - `migrateHomeDataOnce` copies `tickets/runs/kanban/llm` once and writes marker `.migrations/home-import-v1.done`, and subsequent runs are no-ops.
  - `ResolveRunsRootForWorkspace` favors `.ae` when present in workspace and does not use `RUNS_ROOT` when workspace provided.

- Settings normalization tests:
  - Settings load/migrate behavior: `free` → `local`, `paid` → `hosted`, `demo` → `composite`.

Expected failure modes:
- Missing tools for detection (`nvidia-smi`, `free`, `sysctl`, `wmic`) — detection returns conservative values (0 or fallback) and tier classification will likely place node in tier 1 or 2 depending on system RAM.
- Non-writable config directories — `NewSettingsStore` attempts `os.MkdirAll(dir, 0755)`. If the process can't write, NewSettingsStore may still return a store pointing to a path it cannot write to; Save() will fail with permissions error. Ensure directories are writable by service account.
- Multiple processes writing settings concurrently — `SettingsStore` implements in-process mutex only; for multi-process coordination, file-level locking is not implemented; rely on single-process owner of settings file or external coordination.

---

## Example operational commands & paths {#handbook:appendix-e}

- Settings path (example):
  - If `HAL_INSTALL_CONFIG_DIR=/opt/hal`, settings path: `/opt/hal/llm/settings.json`
  - Otherwise, project data path example: `/workspace/project/.ae/llm/settings.json` (created by EnsureProjectDataRoot)

- Hardware cache:
  - `~/.hal/hardware.json` (example: `/home/hal/.hal/hardware.json`)

- Running service:
  - Build: `go build -o hal ./cmd/hal`
  - Start LLM service: `./hal serve llm` (Ensure AE_DATA_ROOT/WORKSPACE_ROOT or HAL_INSTALL_CONFIG_DIR environment variables are set before starting.)

- To force-set PM backend (programmatic):
  - In code / admin API: call `SettingsStore.SetPMBackend("llamacpp")` and Save() persists it.

---

## Summary of critical file paths (quick reference) {#handbook:appendix-e}
- Settings store path (NewSettingsStore chooses among):
  - `<HAL_INSTALL_CONFIG_DIR>/llm/settings.json`
  - `<installRoot>/.ae/llm/settings.json` or `<installRoot>/.hal/llm/settings.json` (via ResolveInstallDataRoot)
  - `<AE_DATA_ROOT>/llm/settings.json` or `<HAL_DATA_ROOT>/llm/settings.json`
  - `./.hal/llm/settings.json` (cwd fallback)

- Hardware cache:
  - `~/.hal/hardware.json` (CachePath)

- Migration marker:
  - `<projectDataRoot>/.migrations/home-import-v1.done`

- LLM defaults authored in:
  - `internal/hwdetect/hwdetect.go` (ClassifyTier, DefaultsForTier)
  - `cmd/llm/storage/settings.go` (Local model aliases, retired lists, normalization)

---

## Recommended operational checklist (before first run) {#handbook:appendix-e}
1. Choose between install-managed vs per-project configuration:
   - If centralized: set `HAL_INSTALL_CONFIG_DIR` to an operator-controlled directory and place provider key files there.
   - If per-project: ensure project directory contains `.ae` or `.hal` and set `WORKSPACE_ROOT` or start process from repo root.

2. Ensure the runtime can execute required probes (nvidia-smi, free/sysctl/wmic) or accept conservative defaults.

3. Configure file-system permissions so the service user can create and write:
   - `<configDir>/llm/settings.json` (owner-write)
   - `<home>/.hal/hardware.json` (owner-write)

4. Verify environment variables for API keys:
   - Set `LLM_API_KEY` or `OPENAI_API_KEY` or install an `openai_api_key` single-line file in the install root.

5. (Optional) For demo deployments, set `ANTIKYTHERA_DEMO_MODE=1` to lock hosted models.

6. Start the service:
   - `hal serve llm` (or use systemd with environment variables set).

7. Inspect logs for:
   - `[settings] load path=... status=ok` messages
   - hardware detection cache creation: `~/.hal/hardware.json`
   - Any permission or probe errors that imply fallback to conservative defaults.

---

## Appendices {#handbook:appendix-e}

- Key functions referenced:
  - Settings and store:
    - cmd/llm/storage/settings.go: NewSettingsStore, SettingsStore.Load, SettingsStore.Save, SettingsStore.Get, SettingsStore.GetWithKeys, SettingsStore.SetPMBackend
    - normalizeModelListForRole, normalizeModelSliceForRole, copyExcludedByRole, copyTierOverrides
  - halpaths:
    - internal/halpaths/paths.go: ResolveInstallDataRoot, ResolveDataRoot, EnsureProjectDataRoot, OpenAIKeyFromEnvOrInstall, ResolveRunsRootForWorkspace
  - hardware detection:
    - internal/hwdetect/hwdetect.go: Detect, DetectAndCache, LoadCached, CachePath, ClassifyTier, DefaultsForTier, detectNvidiaGPU, detectSystemRAM, isAppleSilicon

- Relevant tests:
  - internal/hwdetect/hwdetect_test.go
  - internal/halpaths/paths_test.go

---

End of Appendix E.

---

# Appendix F — Rulebook & Governance {#handbook:appendix-f}

Table of contents
- Sources & canonical files
- Executive summary of governance model
- Constitution: immutable core rules (reference + enforcement locations)
- Role playbooks (Implementation, PM, QA, Process Review) — responsibilities, non-negotiables, and file references
- Models & hardware governance (model catalog)
- Tooling, allowed interfaces, and the Tool Gateway contract
- Patch/edits rules, file-size & rewrite enforcement, and search_replace semantics
- Testing, verification, and artifact requirements (8 artifacts + verification.md)
- Ticket lifecycle, state transitions, and event protocol
- Observability, failure evidence, and logging governance
- Turn budgets, context budgets, and offline guarantees
- Concurrent workspace rules and merge/worktree hygiene
- QA governance: report structure, pass/fail actions, and artifacts
- PM governance: DoR, ticket sizing, and acceptance criteria checks
- Process Review governance: inputs, constraints, and outputs
- Enforcement surfaces: where rules are validated in code/CI/hooks
- Rule & file index (quick map)

---

## Sources & canonical files {#handbook:appendix-f}
Primary rulebook and governance documents (paths relative to repo root):
- rulebook/constitution.md
- rulebook/models-catalog.json
- rulebook/roles/implementation.md
- rulebook/roles/pm.md
- rulebook/roles/qa.md
- rulebook/roles/process_review.md
Supplemental local policy fragments:
- .cursor/rules/artifact-append.mdc
- .cursor/rules/terminal-timeout.mdc

Operational code & infra references used by enforcement or examples:
- .husky/pre-commit
- .husky/pre-push
- .husky/post-commit
- .husky/post-merge
- .golangci.yml
- antikythera/.env.example
- apps/ui/package.json
- apps/hal-desktop/src-tauri/src/{hal.rs,main.rs,nats.rs,ollama.rs}
- query_cards.go (root)
- AGENTS.md
- README.md

Pipeline/policy references (expected locations — used by agents/pipeline):
- policies/artifacts.yml (referenced throughout rulebook; expected pipeline configuration)
- rulebook/rules/*.md (see constitution links for specific rule IDs)

---

## Executive summary of governance model {#handbook:appendix-f}
- There is a single, authoritative Constitution (rulebook/constitution.md). Core behaviors are mandatory for all agents and services at all times.
- Role playbooks define *how* distinct agents (Implementation, PM, QA, Process Review) must behave in the ticket lifecycle. These are normative and machine-interpretable.
- Enforcement is both procedural (agent tool-use flows, required artifacts) and technical (edit/patch limits, pre-commit hooks, CI checks). Violations lead to rejections, QA failures, or creation of Implementation notes.
- Every change must produce an observable evidence trail (runId + correlationId) and a fixed set of artifacts stored per run.
- Tool access is proxied through a Tool Gateway — direct network/filesystem access is forbidden except via approved tool calls. Offline mode is an absolute guarantee when enabled.

---

## Constitution — immutable core rules (high-value items) {#handbook:appendix-f}
Reference: rulebook/constitution.md

Key rules (canonical paraphrase + enforcement/implementation notes):

1) Plan then patch
   - No code changes without an explicit plan file (plan.md). Implementation agents must produce a plan artifact before edits.

2) Patch-only outputs for implementation
   - Agents produce edits (search_replace) or minimal patches, not full-file rewrites unless justified.
   - Enforcement: edits replacing > 40% of a file are rejected (exception: files ≤100 lines exempt); new file length caps (≤200 lines general, ≤350 lines for tests).
   - Implementation service enforces this policy at the patch submission layer (see "Enforcement surfaces" below).

3) Contract-first messaging
   - New commands/events/tools require a schema + fixture prior to use. See role playbook for Implementation (CONTRACT-SCHEMA-001).

4) Strict boundaries
   - Service imports are restricted. Shared dependencies limited to /packages/contracts and /packages/sdk. Violation detection happens in build/analysis CI jobs and linters.

5) Tool gateway only
   - Agents may not access filesystem/git/test execution outside approved Tool Gateway interfaces. The canonical approved tool-use flow: read_file, write_file, edit_file, run_command, list_directory, task_complete.
   - See rulebook/roles/implementation.md for required tool call sequence.

6) Everything is observable
   - All actions must be traceable using runId + correlationId in logs and events. These must appear in artifacts and QA bundles.

7) Failures produce evidence
   - Failures must emit a Failure Event and reference a Failure Bundle (logs + artifacts). QA/Implementation flows expect these.

8) Offline mode hard guarantee
   - When offline_local is enabled, no outbound network calls (including to hosted LLMs) are permitted.

9) Use data over context for measurable outcomes
   - For metric-related tickets, agents must fetch measurement data (metrics.json, coverage reports, lint outputs) before semantic search.

10) Turn budgets
   - Finite turn budgets for agent loops (examples given in constitution: NEED loop max 4, tool-use loop max 20, escalation threshold 10). Agents must converge or fail with evidence.

11) Context budget awareness
   - Prompts must fit model context windows. Policies are in policies/context.yml (referenced) and the model catalog guides default contexts.

12) Verification evidence & Go test hygiene
   - Implementation runs must record verification commands and outcomes in verification.md. Go test changes must satisfy GO-TEST-PACKAGE-001.

---

## Role playbooks — summary, responsibilities, and key enforcement points {#handbook:appendix-f}

Paths: rulebook/roles/*.md

Implementation Agent (rulebook/roles/implementation.md)
- Purpose: Turn a ticket into a safe, test-covered patch that compiles and passes checks.
- Mandatory workflow:
  1. Produce plan.md (CONSTITUTION-PLAN-001).
  2. Execute edits via write_file/edit_file tools (patch-only per constitution).
  3. Add/modify exhaustive unit tests for every change.
  4. Run build/tests via run_command.
  5. Call task_complete when done.
- Outputs: eight artifacts required by pipeline (plan.md, worklog.md, changed-files.md, decisions.md, verification.md, pm-review.md, git-diff.txt, instructions-used.md).
- Non-negotiables: exhaustive unit tests, no TODO stubs, deterministic isolated tests, file size & rewrite limits enforced.
- Concurrent workspace requirements: read_file before every edit, narrow-scope edits, reconcile on mismatch.
- Edit semantics: use exact old_string from read_file for edit_file operations (no guessing).
- Enforcement hooks are applied in the implementation service and CI layers (see "Enforcement surfaces").

Project Manager Agent (rulebook/roles/pm.md)
- Purpose: Convert goals into scoped tasks with acceptance criteria, DoR, risk tiers, and dependencies.
- Obligations:
  - Populate Definition of Ready in the ticket on refinement.
  - Include Context / suspected cause and Suggested implementation direction when code context exists.
  - Acceptance criteria must be concrete (selectors, routes, CLI invocation).
  - Ticket sizing: bias to split tasks; provide SPLIT_INTO_TICKETS response when needed.
  - When marking completion, PM must verify Key Decisions and AC Confirmation Checklist artifacts are present.
- Special case: "connect to repo" tickets are scoped to adding git remote only.

QA Agent (rulebook/roles/qa.md)
- Purpose: Verify changes using automated checks, produce evidence, and publish QA verdicts.
- Workflow:
  1. Validate schemas, presence of all 8 artifacts.
  2. Run unit/integration checks; E2E where UI affected.
  3. Produce QA run bundle and qa-report.md with mandated structure.
  4. Emit QAApproved or QARejected with rule IDs on failures.
- Non-negotiables:
  - Rejections must cite rule IDs.
  - Playwright artifacts collected on both success and failure.
  - Failures must include primary error summary, artifact refs, and log anchors (runId/correlationId/checkId).
- On PASS: store report, merge branch, move ticket to Ready for Human Review, emit QA result.
- On FAIL: store report, create implementation-agent-note.md, move card to Ready to Do, do not merge.

Process Review Agent (rulebook/roles/process_review.md)
- Purpose: Read completed ticket artifacts and suggest high-level rulebook improvements.
- Inputs required: full PM interaction history (every model reply), cycle counts, failure corrections.
- Outputs: process-review-report.md with summary, observations, and rulebook improvement suggestions mapped to rulebook files.
- Constraints:
  - Must cite specific rulebook file(s) for each suggestion.
  - Suggestions must be generalizable principles, not one-off fixes.
  - Keep rules minimal; prefer consolidating existing rules.

---

## Models & hardware governance {#handbook:appendix-f}
Path: rulebook/models-catalog.json

- This JSON is the curated model catalog used by the engine to map model IDs to roles, tiers, memory/context constraints, and capabilities.
- Agents must use the catalog for:
  - Selecting default/allowed models by hardware tier.
  - Enforcing context window limits for prompt construction.
  - Applying offline/local constraints (see "offline mode").
- The catalog contains:
  - model id, displayName, vendor, roles, tiers, minMemoryGB, contextWindow, capabilities, description.
  - hardwareTiers with defaults per tier and numCtx recommendations.
- Example uses:
  - Implementation runs must honor context window when building prompts for LLM calls (per constitution and policies/context.yml).
  - Process Review and PM agents consult the catalog when deciding model escalation or hardware-related constraints.

---

## Tooling and allowed interfaces (Tool Gateway) {#handbook:appendix-f}
Approved tool-use flow (canonical): read_file, write_file, edit_file, run_command, list_directory, task_complete.

- Tool Gateway is the only allowed mechanism for agents to interact with repository and run commands.
- Direct usage of filesystem, git, or test runners outside the gateway is forbidden — enforced by agent runtime and checked by QA.
- Tool semantics:
  - read_file(path): returns exact file text; required before edit_file.
  - edit_file(path, old_string, new_string): apply patch replacing exact old_string. Old_string must be verbatim from read_file.
  - write_file(path, content): author new file content.
  - list_directory(path): enumerate directory entries (for discovery at plan time).
  - run_command(cmd): execute commands (e.g., pnpm test, go test ./...). Must record outputs and exit codes.
  - task_complete(status, artifacts): finalize run and publish artifacts.
- Legacy tool flows are tolerated where indicated (legacy Tool Gateway), but new work must prefer the approved tool-use flow.

---

## Patch / edits rules, file-size limits, and search_replace semantics {#handbook:appendix-f}
Source references: rulebook/constitution.md and rulebook/roles/implementation.md (edits/search_replace sections).

Key constraints:
- Use edit_file (search_replace) or write_file.
- For edit_file, old_string must match exactly what read_file returned — never guess or invent old_string.
- No full-file rewrites unless necessary and justified in plan.md.
- Rewrites (edits) that replace >40% of file length are rejected by enforcement logic (exceptions: files ≤100 lines exempt).
- New file creation limits:
  - New files must be ≤200 lines (general).
  - New test files may be ≤350 lines.
- JSON strings in patches must use double quotes and proper escaping.
- For appends, use a unique old_string anchor to avoid conflicting import/package blocks.
- Go-specific test APIs and mock naming rules: see GO-TEST-APIS-001 in rulebook/rules (referenced from implementation playbook).

Rationale:
- Limits protect concurrent writers from wide-sweeping diffs and encourage incremental, reviewable patches.
- Exact old_string requirement ensures deterministic application of edits in concurrent environments.

---

## Testing, verification, and artifact requirements {#handbook:appendix-f}

Required artifacts (from implementation playbook)
All runs must produce the following under the run directory (see policies/artifacts.yml):
- plan.md — Implementation plan (steps, approach)
- worklog.md — Chronological log of work performed
- changed-files.md — List of changed file paths + descriptions (or "No files changed" with reason)
- decisions.md — Key design decisions and tradeoffs
- verification.md — Verification steps, commands run, and AC checklist evidence
- pm-review.md — PM review content including Key Decisions
- git-diff.txt — Full git diff of the change
- instructions-used.md — Reference to rule/instruction documents used

Verification.md specifics:
- Must include real verification commands run and their outputs (stdout/stderr).
- For Go changes: meat of verification must obey GO-TEST-PACKAGE-001 (no placeholder tests, unique Test* names, assertion heuristics).
- For UI changes: include tests run (pnpm test, playwright commands), links to generated artifacts (screenshots, videos).
- AC Confirmation Checklist: each acceptance criterion enumerated with Met/Not met and evidence pointers (file paths, test names, command outputs).

Test hygiene & constraints:
- Tests must be deterministic and isolated. No dependence on external network/filesystem unless ticket explicitly allows integration tests.
- No TODO stubs. Empty/skipped tests cause runs to be rejected.
- When touching files with existing tests, the agent must ensure test coverage is exhaustive for changed behavior.

Coverage tasks:
- Agents must read metrics.json to determine baseline coverage and focus improvements per CODE-COVERAGE-001 rules.

---

## Ticket lifecycle, state transitions, and event protocol {#handbook:appendix-f}

Canonical lifecycle:
- Unassigned → Ready to Do → In Progress → Ready for QA → Ready for Human Review → Done
(Transitions are driven by events the system publishes; specific event examples exist inline in role playbooks.)

Event & command examples (protocol-level):
- Kanban.MoveCard — used to move cards between columns (QA PASS/FAIL triggers).
- Task artifacts and states must be published to the pipeline run directory and referenced in QA/PM notes.

Implementation completion requirements:
- All 8 artifacts produced and verified.
- AC Confirmation Checklist filled and evidence presented.
- PM Review includes Key Decisions (2–6 bullets).
- After successful run+artifacts, Implementation agent must move ticket to Ready for QA automatically.

QA outcomes:
- On PASS: QA merges branch to main, cleans feature branch (local + remote), and moves the card to Ready for Human Review.
- On FAIL: QA creates implementation-agent-note.md and moves the ticket back to Ready to Do; feature branch must not be merged.

Human Review:
- Separate manual review stage; PM will not mark Done until Key Decisions and AC evidence are validated.

Process Review:
- Post-completion review analyzes interactions to propose rule changes; its output is a process-review-report.md.

---

## Observability, logging, and failure evidence {#handbook:appendix-f}
- Every action/event must be traceable via runId + correlationId.
- All log lines, event payloads, and artifacts for a run must include runId/correlationId as cross-references.
- Failures must yield a Failure Event and a Failure Bundle reference. Failure Bundle must include:
  - Relevant logs (with runId/correlationId)
  - Error tracebacks or process exit codes
  - Test failure artifacts (screenshots, failing test names, stack traces)
  - The git-diff.txt and changed-files.md for context
- QA reports and Implementation artifacts must include anchors to Failure Bundles in case of rejects.

Suggested storage locations (pipeline expected layout):
- run/<runId>/{plan.md,worklog.md,changed-files.md,decisions.md,verification.md,pm-review.md,git-diff.txt,instructions-used.md,qa-report.md,implementation-agent-note.md,process-review-report.md}
- Failure bundles under run/<runId>/failure-bundle/*

---

## Turn budgets, context budgets, and offline guarantees {#handbook:appendix-f}

Turn budgets:
- Agents must respect finite loop counts:
  - NEED loop max: 4 turns
  - Tool-use loop max: 20 turns
  - Escalation threshold: 10 turns
- If loops hit limits without convergence, agent must fail with evidence and create an appropriate Failure Event and Failure Bundle.

Context budgets:
- Prompts sent to LLMs must be sized per policies/context.yml and rulebook/models-catalog.json (numCtx defaults).
- Agents must never inject unbounded content into prompts. If content exceeds budget, agent must use retrieval/summarization steps.

Offline guarantees:
- When offline_local mode is active:
  - No outbound network calls
  - No hosted/remote LLM calls
  - Agents must use local models per models-catalog.json selection rules
- Offline mode must be validated in the run artifacts (verification.md records that offline mode was enforced and how).

---

## Concurrent workspace rules and worktree hygiene {#handbook:appendix-f}
- Always read files immediately before editing (read_file → edit_file), to avoid stale edits.
- Keep edits as narrow as possible — avoid touching files outside ticket scope.
- If the file content differs from the plan's snapshot, stop and re-plan rather than forcing edits.
- Worktrees and feature branches:
  - QA ensures feature branches are cleaned up on PASS (merged + deleted).
  - If an implementation used a worktree, ensure cleanup or merge before moving forward.

---

## QA governance — report structure and pass/fail actions {#handbook:appendix-f}
Reference: rulebook/roles/qa.md

qa-report.md required structure (strict):
1. Ticket & deliverable — ticket id, title, and human-verifiable deliverable description
2. Missing artifacts — if some of the 8 artifacts missing or invalid → FAIL
3. Code review — PASS/FAIL with file path references & rule violations
4. Build verification — commands run (e.g. pnpm run build, npx tsc -b --noEmit, go test), stdout/stderr snapshots
5. Coverage — 4-metric table (Lines, Functions, Branches, Statements) for whole repo and per-targeted package if coverage task — command used to generate
6. Code quality — single percentage and brief guidance (linter or static analysis output summary)
7. UI verification — automated or manual steps performed, with artifacts (screenshots, Playwright traces)
8. AC Confirmation Checklist — list each AC with Met/Not met and concrete evidence (file path, test name, command output)
9. Verdict — PASS or FAIL

On PASS:
- Store qa-report.md in run bundle
- Merge feature branch into main and delete feature branch both remote & local
- Move card to "Ready for Human Review"
- Emit QA-approved event with runId/correlationId

On FAIL:
- Store full QA report in run bundle
- Create implementation-agent-note.md containing 2–4 actionable bullets for implementer
- Move card to "Ready to Do"
- Do not merge feature branch
- Emit QA-rejected event with rule IDs and runId/correlationId

---

## PM governance — DoR, ticket sizing, and acceptance criteria {#handbook:appendix-f}
Reference: rulebook/roles/pm.md

Definition of Ready (DoR) — PM must provide directly in ticket description:
- scope & non-goals
- acceptance criteria (specific, verifiable)
- risk tier (low/medium/high)
- dependencies (contracts/tools)
- Context / suspected cause and suggested implementation direction (file paths, selectors, DOM cues) when code context exists

Ticket sizing rules:
- Prefer splitting if ticket touches >2 packages, >2 independent changes, or spans unrelated components
- If too large: return SPLIT_INTO_TICKETS JSON array; create sub-tickets accordingly

Completion validation (PM checklist prior to marking Done):
- Confirm Key Decisions present in pm-review.md
- Confirm AC Confirmation Checklist is present and all ACs marked Met or documented as out-of-scope
- If either missing, reject and move ticket back

Special-case rules:
- "connect to repo" tickets must be scoped to git remote configuration only.

---

## Process Review governance {#handbook:appendix-f}
Reference: rulebook/roles/process_review.md

Inputs required:
- Full PM conversation logs and model responses (every turn)
- Every cycle and trigger (NEED events, retries, escalations)
- Run artifacts including implementation-agent-note.md, qa-report.md, verification.md
- Turn counts and escalation events (NEED -> read_file, tool-use cycle data)

Outputs:
- process-review-report.md containing summary, observations, and proposals for rule changes mapped to specific rulebook files

Constraints:
- Only propose generalized principles; no one-off bug patches
- Every suggestion must cite a rulebook file to be amended
- Keep rule additions minimal and high leverage

---

## Enforcement surfaces — where rules are validated in code, CI, and hooks {#handbook:appendix-f}

Primary enforcement layers:
1. Implementation service (runtime)
   - Enforces edit semantics and patch size limits (edits replacing >40% rejected).
   - Watches tool calls to ensure only approved tool interfaces used.
   - Log runId + correlationId.

   Note: rulebook mentions implementation-related files such as impl_*.go (convention). Search for impl_* in repository (not present in listing here); the runtime is expected to implement these checks. Where code exists, enforcement may be in packages under antikythera/ or agent runtimes.

2. Pre-commit / pre-push hooks
   - .husky/pre-commit
   - .husky/pre-push
   - .husky/post-commit
   - .husky/post-merge
   Hooks may perform local checks (lint, go vet), prevent accidental wide rewrites, or verify run artifacts presence.

3. CI and linters
   - .golangci.yml (Go linting rules)
   - CI jobs must validate package import boundaries (strict boundaries rule), contract/schema existence, and run go vet where required.
   - QA pipeline validates presence of the 8 artifacts and enforces QA non-negotiables.

4. QA pipeline
   - Validates artifacts, runs tests, collects Playwright artifacts, produces qa-report.md and enforces pass/fail merge behavior.

5. Runtime monitoring
   - Agents must emit runId + correlationId to logs; operational tooling must collect and index logs for traceability.

Where enforcement decisions are stored:
- policies/artifacts.yml (artifact storage and retention)
- rulebook/rules/*.md for explicit rule IDs referenced in rejections (e.g., CODE-COVERAGE-001, GO-TEST-PACKAGE-001)

---

## Example verification commands & where to run them {#handbook:appendix-f}
Implementation and QA runs typically execute the following commands (via run_command tool):

- JavaScript/TypeScript (frontend)
  - pnpm install (if needed)
  - pnpm test
  - pnpm test --reporters=jest-junit (or coverage flags)
  - pnpm build / npm run build
  - Playwright invocations for e2e (collect traces/screenshots)

Files referenced:
- apps/ui/package.json — test/build script definitions
- apps/ui/src/* — source & test files (example test suites: Board.test.tsx, AppHeader.test.tsx, components/*.test.tsx)

- Go services
  - go test ./... (package targets)
  - go vet ./...
  - staticcheck or golangci-lint (per .golangci.yml)
Files referenced:
- antikythera/go.mod
- cmd/<service>/app / cmd/<service>/domain packages (conventional layout referenced in PM playbook)
- query_cards.go (root) — repository example Go file to be referenced in tests if targeted

Verification.md must capture:
- The exact run_command strings used
- Exit codes, stdout/stderr excerpts or attachments
- Test names and failing/passing counts
- Coverage numbers and per-package breakdowns for coverage tasks

---

## Rule & file index (quick map) {#handbook:appendix-f}

- rulebook/constitution.md
  - Core rules: plan then patch, patch-only outputs, contract-first messaging, tool gateway only, observability, failure evidence, offline mode, budgets, context awareness, verification evidence.

- rulebook/models-catalog.json
  - Model / tier mapping for model selection & context window governance.

- rulebook/roles/implementation.md
  - Implementation flow, required artifacts (8), non-negotiables, edits/search_replace rules, concurrent workspace rules, GO test policies.

- rulebook/roles/pm.md
  - DoR requirements, ticket sizing and splitting rules, connect-to-repo special case, completion checks for PM.

- rulebook/roles/qa.md
  - QA workflow, qa-report.md structure, pass/fail actions, automation artifact collection.

- rulebook/roles/process_review.md
  - Process review inputs, outputs, constraints, and required references to rulebook files for proposed changes.

- .cursor/rules/artifact-append.mdc
  - Local policy fragments used by pipeline/agents relating to artifact append behavior.

- .cursor/rules/terminal-timeout.mdc
  - Local policy fragments for terminal/command timeouts in run_command tool.

- .husky/{pre-commit,pre-push,post-commit,post-merge}
  - Local git hooks for developer flow; used for fast local enforcement.

- .golangci.yml
  - Lint configuration for Go code; part of enforcement of import and style rules.

- apps/hal-desktop/src-tauri/src/{hal.rs,main.rs,nats.rs,ollama.rs}
  - Example platform/native agent integration points that must conform to tool gateway and observability expectations (emit runId/correlationId).

- apps/ui/src/*
  - Frontend code and tests illustrating test hygiene expectations (exhaustive tests, deterministic, no TODO stubs).

---

## Governance change process & triage {#handbook:appendix-f}
- Rulebook amendments are proposed by Process Review outputs (process-review-report.md) referencing rulebook files.
- Any rule change must:
  - Be generalizable (no single-issue fixes)
  - Cite evidence from runs (turn counts, failure bundles)
  - Minimize total rule count; prefer consolidation
- Approvals for changes must be recorded with a runId and be traceable.

---

## Practical notes for implementers and reviewers {#handbook:appendix-f}
- Always attach runId + correlationId to every artifact and log message.
- Produce the 8 artifacts — QA rejects runs missing any required artifact.
- When in doubt about patch scope, split the ticket.
- For edits: read_file immediately before edit_file; use exact old_string.
- Add exhaustive tests for any touched file — the absence of tests or presence of TODOs leads to rejection.
- For coverage tickets: read metrics.json and show per-package coverage improvements in verification.md.

---

## Contact & operational documents {#handbook:appendix-f}
- AGENTS.md — agent runtime and role mapping (root)
- README.md — repository-level developer guidance and bootstrapping
- policies/artifacts.yml — canonical artifact storage policy (referenced widely; pipeline expects this path)

---

End of Appendix F.

---

> [Section generation failed. Run docgen --section appendix-g to retry.]
