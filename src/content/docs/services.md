# Antikythera Engine Service Entry Points

Each service has a **lightweight HTTP UI** for verification. Start NATS first, then run each service from the repo root. For LLM features (PM Chat, Context embeddings, Implementation plans), run Ollama or another OpenAI-compatible API at `http://127.0.0.1:11434`. The easiest way is **one command:** `pnpm hal` (Unix) or `pnpm hal:win` (Windows) — that starts the full stack including bundled Ollama and NATS. The Context service auto-indexes the `specs` and `docs` directories on startup so PM chat retrieval works without a manual embed step.

## Prerequisites

- NATS: use bundled (`scripts/ensure-bundled.sh` exports `NATS_BIN`) or run `nats-server`
- From repo root: `cd /path/to/antikythera`
- (Optional) Ollama: bundled when you run `pnpm hal`; or `ollama pull llama3` and `ollama serve` for manual runs

## URLs and Ports

| Service | Port | URL |
|---------|------|-----|
| QA | 8091 | http://127.0.0.1:8091 |
| Context | 8092 | http://127.0.0.1:8092 |
| PM | 8093 | http://127.0.0.1:8093 |
| Implementation | 8094 | http://127.0.0.1:8094 |
| Process Review | 8095 | http://127.0.0.1:8095 |
| LLM Gateway | 11434 | http://127.0.0.1:11434 |
| Orchestrator | (no HTTP) | NATS only – listens to CardMoved, triggers QA/ProcessReview |

Override with `HTTP_ADDR` (e.g. `HTTP_ADDR=:9091 go run ./cmd/qa`).

## Run Each Service

```bash
# Terminal 1: NATS (or use bundled)
. scripts/ensure-bundled.sh && $NATS_BIN -js -p 4222

# Terminal 2: Orchestrator (column triggers QA/Process Review)
go run ./cmd/orchestrator

# Terminal 3: LLM Gateway (optional – for PM Chat, Context, Implementation)
go run ./cmd/llm
# Open http://127.0.0.1:8096

# Terminal 4: QA (runs Playwright E2E)
go run ./cmd/qa
# Open http://127.0.0.1:8091

# Terminal 5: Context (embed + query, uses LLM embeddings when available)
go run ./cmd/context
# Open http://127.0.0.1:8092

# Terminal 6: PM (spec → tickets, chat, Kanban create via chat)
go run ./cmd/pm
# Open http://127.0.0.1:8093

# Terminal 7: Implementation (tool-use agent: read/write/edit/run, or pair-based JSON edits)
go run ./cmd/implementation
# Open http://127.0.0.1:8094

# Terminal 8: Process Review (validate manifest)
go run ./cmd/process_review
# Open http://127.0.0.1:8095
```

## Health Checks

```bash
curl http://127.0.0.1:8091/health  # QA
curl http://127.0.0.1:8092/health  # Context
curl http://127.0.0.1:8093/health  # PM
curl http://127.0.0.1:8094/health  # Implementation
curl http://127.0.0.1:8095/health  # Process Review
```

## Environment

| Env | Services | Default |
|-----|----------|---------|
| `NATS_URL` | All | `nats://127.0.0.1:4222` |
| `HTTP_ADDR` | All | `:8091`–`:8096` per service |
| `WORKSPACE_ROOT` | PM, Implementation, QA | `.` (repo root) |
| `CONTEXT_ROOT` | Context | `.` |
| `RUNS_ROOT` | Process Review, QA | `~/.hal/runs` |
| `LLM_BASE_URL` | LLM Gateway | `http://127.0.0.1:11434` (Ollama) |
| `LLM_GATEWAY_URL` | PM, Context, Implementation | `http://127.0.0.1:8096` |
| `CONTEXT_URL` | PM (for chat context retrieval) | `http://127.0.0.1:8092` |
