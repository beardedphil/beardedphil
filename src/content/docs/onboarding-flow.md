# New Project Onboarding (Future)

When an existing project is connected to Antikythera Engine for the first time, the engine should:

1. **Generate project docs** — Run `pnpm hal:regenerate-docs` (or `go run ./cmd/docgen <workspace>`) to create:
   - `docs/project-description.md` — concept→path map
   - `docs/directory-map.md` — annotated tree
   - `docs/project-handbook.md` — business overview + technical appendices

2. **Wire metrics badges** — Connect the workspace’s metrics output (e.g. `metrics.json`, coverage) to the Engine UI badges. Requires:
   - Workspace to expose metrics in a known format (e.g. `metrics.json` at repo root)
   - Engine Kernel/UI to support per-workspace metrics configuration
   - Config mapping workspace root → metrics path

**Current state:** `hal:regenerate-docs` already generates the three docs for any workspace. Set `HAL_LOCAL_LLM_PROJECT_MANAGER` or `LLM_MODEL` and run:

```bash
pnpm hal:regenerate-docs           # uses . (repo root)
go run ./cmd/docgen /path/to/proj  # any workspace
```

Metrics wiring is not yet implemented.
