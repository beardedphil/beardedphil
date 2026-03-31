/**
 * Docs surfaced in this portfolio (bundled Markdown). Derived from the Engine modal list in
 * `apps/ui/src/components/documentationLinks.ts`, but entries may be omitted here on purpose.
 */
export interface DocLink {
  label: string;
  /** e.g. "project-handbook.md" → GET /docs/project-handbook.md in the UI */
  file: string;
}

export const DOCUMENTATION_LINKS: DocLink[] = [
  { label: "Architecture Antikythera And Agent Chat", file: "ARCHITECTURE-ANTIKYTHERA-AND-AGENT-CHAT.md" },
  { label: "Demo", file: "demo.md" },
  { label: "Docgen Prompt Spec", file: "docgen-prompt-spec.md" },
  { label: "Local Setup", file: "local-setup.md" },
  { label: "Obstacles Broad Requests", file: "OBSTACLES-BROAD-REQUESTS.md" },
  { label: "Onboarding Flow", file: "onboarding-flow.md" },
  { label: "Plan Context Management Like Cursor", file: "PLAN-CONTEXT-MANAGEMENT-LIKE-CURSOR.md" },
  { label: "Plan Metrics Resilience", file: "PLAN-METRICS-RESILIENCE.md" },
  { label: "Plan Rulebook Compliance And Summary Embedding", file: "PLAN-RULEBOOK-COMPLIANCE-AND-SUMMARY-EMBEDDING.md" },
  { label: "Plan Ticket Automation Demo", file: "PLAN-TICKET-AUTOMATION-DEMO.md" },
  { label: "Project Handbook", file: "project-handbook.md" },
  { label: "Services", file: "services.md" },
  { label: "Testing", file: "TESTING.md" },
].sort((a, b) => a.file.localeCompare(b.file));
