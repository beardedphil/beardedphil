# Antikythera Engine and Agent Chat (Kyther)

## Overview

- **Kyther** — Main chat with the Antikythera Engine. Kyther is the front door; the engine spins up agents as needed (e.g. "create a ticket" → PM agent).
- **Per-agent chat streams** — When an agent is working on a task (PM refining, Implementation building, QA verifying), that agent has an associated chat with:
  - A **progress stream** (SSE) — agent emits status updates
  - **Agent → user** — agent can ask follow-up questions (`MessageToUser`)
  - **User → agent** — user messages can be associated with that agent run (delivery and semantics evolve with the product)
- **SSE** — Yes, Server-Sent Events. The Kernel already forwards all `evt.*` to SSE clients; agent progress/chat events use this stream.

## Event Model (unified)

| Event | Payload | When |
|-------|---------|------|
| `evt.Agent.RunStarted.v1` | `{ agentType, runId, cardId, summary? }` | Agent begins work on a task |
| `evt.Agent.RunProgress.v1` | `{ agentType, runId, cardId, message, step? }` | Agent emits a progress update |
| `evt.Agent.MessageToUser.v1` | `{ agentType, runId, cardId, message }` | Agent asks user a question |
| `evt.Agent.RunCompleted.v1` | `{ agentType, runId, cardId, status, summary? }` | Agent finishes work |

## Kyther vs Agent Chat

- **Kyther (main chat)** — User talks to the Antikythera Engine through the primary chat surface. Routing sends work to agents or responds directly. Commands: create ticket, move ticket, general questions. Ticket operations still go through PM for now.
- **Agent Chat** — When PM/Implementation/QA is working on a card, a thread appears for that run. Shows progress stream + agent questions + user replies. The UI is oriented toward messaging and visibility; halting or preempting a running agent mid-task is still a work in progress.

## Routing

- `cmd.HAL.ChatRequest.v1` — User message to the main chat surface (historical subject name). The engine decides: create ticket → PM, move ticket → Kanban, etc. For now, main chat still uses `cmd.PM.ChatRequest.v1` for ticket chat.
- `cmd.Agent.ChatRequest.v1` — User message to a specific agent run. Payload: `{ runId, agentType, message }`. PM/Implementation/QA subscribe and handle when `runId` matches their run.

## UI Structure

- **Kyther** — One floating chat icon (bottom-right). Opens to the main Antikythera conversation.
- **Agent threads** — When agents are active, the main chat shows tabs or a list, e.g. `Kyther | PM (ticket-123) | Implementation (ticket-123)`. Each tab: progress stream + messages + input.
- **Notification** — Badge on chat icon when any agent sends MessageToUser.

## Rulebook: Antikythera Engine base + project overrides

All models (PM, Implementation, etc.) get the **Antikythera Engine rulebook** by default. Project-specific rules **override** when present; any scenario not overridden falls back to the engine defaults. No user configuration (e.g. env vars) is required.

- **Engine rulebook root** — Discovered automatically by walking up from the running executable until `rulebook/constitution.md` is found. So when the engine is run from the repo, the rulebook is always available.
- **Merged loading** — `rulebook.LoadMergedForAgent(workspace, agent)` returns:
  - **Engine base**: from the discovered root; always used when present.
  - **Project overrides**: when the connected workspace is set and is not the Antikythera repo, the project’s rulebook (if any) is appended under “Project-specific rules (override base when conflicting)”. The model treats project rules as overriding engine defaults for conflicting guidance.
- **Resulting behavior**: (1) Connected to another project with its own rulebook → engine rulebook + project overrides. (2) Connected to another project without a rulebook → engine rulebook only. When connected to the Antikythera repo itself, engine rulebook only.
- **Retrieval** — Codebase context (semantic search) is still **workspace-scoped**. The merged rulebook gives consistent DoR and behavioral guidance regardless of project.

## Config and API keys: from Antikythera install

LLM settings (API keys, mode, approved models) and the Cursor API key must come from the **Antikythera Engine install**, not the connected project, so that when you connect to another project (e.g. Demo), Implementation and LLM still have keys.

- **LLM settings** — `NewSettingsStore()` prefers the install data root: `AE_INSTALL_CONFIG_DIR` if set, otherwise `<ae-repo>/.ae` (discovered from the executable). Legacy: `HAL_INSTALL_CONFIG_DIR`, `.hal`. So `settings.json` is read/written under the install repo’s `.ae/llm/`, not the project’s `.ae`.
- **Cursor API key** — Resolved in order: env `CURSOR_API_KEY`, then the first line of `<ae-repo>/.ae/cursor_api_key` (legacy `.hal/cursor_api_key`).
- **OpenAI API key** — Resolved in order: env `LLM_API_KEY`, `OPENAI_API_KEY`, `AE_DEMO_OPENAI_KEY` (legacy `HAL_DEMO_OPENAI_KEY`), then the first line of `<ae-repo>/.ae/openai_api_key` (legacy `.hal/openai_api_key`). So you can put the key in the install tree and it is used regardless of which project is connected.
- **Project data dir** — Tickets, runs, kanban, workspace selector still use the project’s `.ae` (or `AE_DATA_ROOT` / `AE_CONFIG_DIR` when set; legacy `HAL_*`, `.hal`); only settings and Cursor key are install-scoped.

## Implementation: QA feedback and duplicate text

When a ticket returns from QA, Implementation must **see the failure first**, not a wall of repeated boilerplate. The pipeline does three things:

1. **Cursor / Kyther (cloud agent)** — `cmd/implementation/transport/cursor_dispatch.go` builds a prompt in this order: short **PRIORITY: fix QA failures** → **QA Failure Report** (from `qa-report.md` on disk when readable, else a **fallback** from the latest `## QA report` block on the card and/or the QA run id) → **Your Task** → **Ticket Description**. In fix mode, the ticket body is **stripped** of accumulated `## QA report` appendices (`internal/carddescription`, `DescriptionForImplementationPrompt`) so history does not drown the acceptance criteria.

2. **Local tool-use Implementation** — Same stripping and QA fallback in `buildPriorContext` / `RunImplementation` (`descForLLM` for plan and edits). Retrieval uses `title + description` (and `DedupeTaskWithTitle` when needed) instead of `task + title`, which used to repeat the card title when `task` already contained `title + "\n\n" + body`.

3. **Kanban card text** — `cmd/qa/transport/handler.go` **replaces** prior QA append blocks (via `StripQAReportAppends`) instead of stacking dozens of `## QA report` sections. Failed runs also add a short **Failure output (excerpt)** on the card so humans and fallback prompts see compiler/test output without opening `.ae/runs/` (legacy `.hal/runs/`).

### Where duplicate text came from (and what we removed)

| Source | Dead weight | Mitigation |
|--------|-------------|------------|
| `Implementation.RunRequested` payload | `task` is often `title + "\n\n" + description`, while `title` and `description` are also sent | **Consumption-side:** `CanonicalImplementationTask` — do not concatenate `task + title + description` again for watch UI, compare prompt, or `fallbackPrompt`. |
| Local retrieval / keyword helpers | `task + " " + title` doubled the title when `task` already started with the title | **`DedupeTaskWithTitle`** in keyword extraction and related helpers. |
| Card after many QA cycles | Huge description from repeated QA appendices | **Strip before append** on each QA run; fix-mode prompts strip for the agent. |

### Optional future shrink

The NATS payload could send **`task` as title-only** when `description` is non-empty (single source of truth in `description`), but that would require auditing every consumer that only reads `task`. Until then, **`CanonicalImplementationTask`** keeps a single canonical string at the edges that matter for prompts and UI.
