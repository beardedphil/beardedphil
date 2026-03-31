import { useState } from "react";
import { MarkdownBlock } from "../components/MarkdownBlock";
import { DOCUMENTATION_LINKS } from "../content/documentationLinks";
import { getArtifactMarkdown, getDocMarkdown } from "../content/embeddedContent";
import { artifactsSectionCopy } from "../content/site";

const HANDBOOK_FILE = "project-handbook.md";

/** HAL-1686 — full run bundle (copied from local ~/.hal/runs/) */
const EXAMPLE_RUN_ARTIFACTS = [
  {
    id: "artifact-worklog",
    title: "Worklog",
    filename: "hal1686-worklog.md",
    pathLabel: "run_7j8r82ayw/worklog.md",
  },
  {
    id: "artifact-plan-summary",
    title: "Plan summary",
    filename: "hal1686-plan-summary.md",
    pathLabel: "run_7j8r82ayw/plan-summary.md",
  },
  {
    id: "artifact-changed-files",
    title: "Changed files",
    filename: "hal1686-changed-files.md",
    pathLabel: "run_7j8r82ayw/changed-files.md",
  },
  {
    id: "artifact-decisions",
    title: "Decisions",
    filename: "hal1686-decisions.md",
    pathLabel: "run_7j8r82ayw/decisions.md",
  },
  {
    id: "artifact-verification",
    title: "Verification",
    filename: "hal1686-verification.md",
    pathLabel: "run_7j8r82ayw/verification.md",
  },
  {
    id: "artifact-instructions-used",
    title: "Instructions used",
    filename: "hal1686-instructions-used.md",
    pathLabel: "run_7j8r82ayw/instructions-used.md",
  },
  {
    id: "artifact-pm-review",
    title: "PM review",
    filename: "hal1686-pm-review.md",
    pathLabel: "run_7j8r82ayw/pm-review.md",
  },
  {
    id: "artifact-git-diff",
    title: "Git diff",
    filename: "hal1686-git-diff.md",
    pathLabel: "run_7j8r82ayw/git-diff.txt",
  },
  {
    id: "artifact-edits-summary",
    title: "Edits summary",
    filename: "hal1686-edits-summary.md",
    pathLabel: "run_7j8r82ayw/edits-summary.md",
  },
  {
    id: "artifact-qa-report",
    title: "QA report",
    filename: "hal1686-qa-report.md",
    pathLabel: "run_tdutg7tmr/qa-report.md",
  },
  {
    id: "artifact-manifest",
    title: "Manifest (QA)",
    filename: "hal1686-manifest.md",
    pathLabel: "run_tdutg7tmr/manifest.json",
  },
] as const;

function orderedDocumentationLinks() {
  const handbook = DOCUMENTATION_LINKS.find((d) => d.file === HANDBOOK_FILE);
  const rest = DOCUMENTATION_LINKS.filter((d) => d.file !== HANDBOOK_FILE);
  return handbook ? [handbook, ...rest] : [...DOCUMENTATION_LINKS];
}

function slugify(file: string): string {
  return file.replace(/\.md$/i, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

function LazyDocDetails({
  docId,
  label,
  file,
  pathLabel,
}: {
  docId: string;
  label: string;
  file: string;
  pathLabel: string;
}) {
  const [showBody, setShowBody] = useState(false);
  return (
    <details
      id={docId}
      className="embedded-doc-details"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) setShowBody(true);
      }}
    >
      <summary className="embedded-doc-summary">
        <span className="embedded-doc-summary-title">{label}</span>
        <code className="embedded-doc-path">{pathLabel}</code>
      </summary>
      <div className="embedded-doc-body">
        {showBody ? <MarkdownBlock markdown={getDocMarkdown(file)} /> : null}
      </div>
    </details>
  );
}

function LazyArtifactDetails({
  id,
  title,
  filename,
  pathLabel,
}: {
  id: string;
  title: string;
  filename: string;
  pathLabel: string;
}) {
  const [showBody, setShowBody] = useState(false);
  return (
    <details
      id={id}
      className="embedded-doc-details embedded-doc-details--artifact"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) setShowBody(true);
      }}
    >
      <summary className="embedded-doc-summary">
        <span className="embedded-doc-summary-title">{title}</span>
        <code className="embedded-doc-path">{pathLabel}</code>
      </summary>
      <div className="embedded-doc-body">
        {showBody ? <MarkdownBlock markdown={getArtifactMarkdown(filename)} /> : null}
      </div>
    </details>
  );
}

export function ArtifactsSection() {
  const docs = orderedDocumentationLinks();

  return (
    <section className="section" id="artifacts">
      <span className="section-label">Documentation &amp; Artifacts</span>
      <h2 className="section-title">Proof of work, not promises</h2>

      <div className="artifacts-subsection" id="documentation">
        <h3 className="artifacts-subsection-title">Documentation</h3>
        <p className="artifacts-subsection-intro">{artifactsSectionCopy.documentationIntro}</p>
        <p className="artifacts-toc-hint">
          Same files as the Antikythera Engine Documentation dialog. Open a section to load the full Markdown into the page.
        </p>
        <nav className="embedded-toc" aria-label="Documentation table of contents">
          <span className="embedded-toc-label">Documentation</span>
          <ul className="embedded-toc-list">
            {docs.map((d) => (
              <li key={d.file}>
                <a href={`#doc-${slugify(d.file)}`}>{d.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="embedded-docs-stack">
          {docs.map((d) => (
            <LazyDocDetails
              key={d.file}
              docId={`doc-${slugify(d.file)}`}
              label={d.label}
              file={d.file}
              pathLabel={`docs/${d.file}`}
            />
          ))}
        </div>
      </div>

      <div className="artifacts-subsection artifacts-subsection--spaced" id="example-artifacts">
        <h3 className="artifacts-subsection-title">Run artifacts (HAL-1686)</h3>
        <div className="artifacts-subsection-intro artifacts-example-run-intro">
          <MarkdownBlock
            markdown={`${artifactsSectionCopy.exampleIntro}\n\n${artifactsSectionCopy.exampleTemplateNote}`}
          />
        </div>
        <nav className="embedded-toc embedded-toc--artifacts" aria-label="HAL-1686 artifact table of contents">
          <span className="embedded-toc-label">HAL-1686 · full bundle</span>
          <ul className="embedded-toc-list">
            {EXAMPLE_RUN_ARTIFACTS.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`}>{a.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="embedded-docs-stack">
          {EXAMPLE_RUN_ARTIFACTS.map((a) => (
            <LazyArtifactDetails
              key={a.id}
              id={a.id}
              title={a.title}
              filename={a.filename}
              pathLabel={a.pathLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
