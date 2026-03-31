# Docgen Generation Architecture

Used by `hal:regenerate-docs` (managed via `cmd/docgen/main.go`) to generate `project-description.md`, `directory-map.md`, and `project-handbook.md`.

## Model Resolution

1. Look up the `local-model-ladder` at `/api/local-model-ladder?task=chat` to find the strongest available tier.
2. Fallback to `HAL_LOCAL_LLM_MODEL` / `HAL_LOCAL_LLM_PROJECT_MANAGER` / `LLM_MODEL`.

## Multi-Pass Handbook Generation

The handbook is divided into multiple independent sections (Chapter 1 Executive Overview, and Appendices A-G).  
Each section performs a separate LLM pass:
- **Executive Overview**: Uses `systemOverviewPrompt`, focusing on high-level business value and cross-linking to Appendices.
- **Appendices**: Use `systemAppendixPrompt`, focusing on exhaustive technical deep-dives for specialized domains.

Context is selectively provided per section using `SourceFiles` and `SourceGlobs` (capped at roughly 32-48KB per call).

## Output files

1. **docs/project-description.md** — Concept-to-path map.
2. **docs/directory-map.md** — Annotated tree.
3. **docs/project-handbook.md** — Full multi-part handbook.

## Incremental Updates (diff.go)

To run quickly in post-commit hooks, `docgen` reads `.docgen-state` for the last known git commit, extracts a unified diff, and only triggers LLM re-generation for sections whose `SourceFiles` or `SourceGlobs` have changed. 
Pass `--full` to bypass this optimization.
