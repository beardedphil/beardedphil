/**
 * Bundled Markdown from `src/content/docs/` and `src/content/artifacts/` (no runtime fetch).
 */
const docModules = import.meta.glob<string>("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const artifactModules = import.meta.glob<string>("./artifacts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function filenameFromGlobPath(globPath: string): string {
  const m = globPath.match(/([^/\\]+\.md)$/);
  return m ? m[1] : globPath;
}

function buildByFile(modules: Record<string, string>): Record<string, string> {
  const byFile: Record<string, string> = {};
  for (const [path, content] of Object.entries(modules)) {
    byFile[filenameFromGlobPath(path)] = content;
  }
  return byFile;
}

const docsByFile = buildByFile(docModules);
const artifactsByFile = buildByFile(artifactModules);

export function getDocMarkdown(filename: string): string {
  const c = docsByFile[filename];
  if (c === undefined) {
    throw new Error(`Missing doc: ${filename} (have: ${Object.keys(docsByFile).sort().join(", ")})`);
  }
  return c;
}

export function getArtifactMarkdown(filename: string): string {
  const c = artifactsByFile[filename];
  if (c === undefined) {
    throw new Error(
      `Missing artifact: ${filename} (have: ${Object.keys(artifactsByFile).sort().join(", ")})`,
    );
  }
  return c;
}
