# Demo Instructions

Run the Antikythera Engine demo with **Go and pnpm**. Uses bundled Ollama and NATS (downloaded on first run).

## Prerequisites

1. Install [Go](https://go.dev/dl/) and [pnpm](https://pnpm.io/) (Node 18+).
2. From the repo root, run: `bash scripts/bootstrap` (one-time).

## Run the demo

From the repo root:

```bash
# Windows
pnpm hal:win

# Unix/macOS
pnpm hal
```

Or: `bash scripts/demo-up` (same as above on Unix).

When you see **Engine Demo Ready**, open in your browser:

- **UI (Kanban board):** http://127.0.0.1:5174
- **Event stream (optional):** http://127.0.0.1:8080/events

Use the board: create tickets, drag them between columns.

Stop: `Ctrl+C` in the terminal.

## Optional: run e2e tests

With the demo stack running in one terminal, in another:

```bash
bash scripts/demo-e2e
```

Playwright runs on the host and produces an HTML report under `~/.hal/runs/<runId>/playwright/report/index.html`.

## What's running

- **NATS** — Message bus used by the kernel and Kanban service (bundled at ~/.hal/nats).
- **Ollama** — Chat and embedding models (bundled at ~/.hal/ollama).
- **Kernel** — HTTP API and command gateway; forwards commands and streams events.
- **Kanban** — Board and ticket state; stores data in SQLite.
- **UI** — React app served on port 5174; talks to the kernel at 127.0.0.1:8080 from your browser.
