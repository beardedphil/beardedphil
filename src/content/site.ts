export interface CtaLink {
  label: string;
  href: string;
  external?: boolean;
  primary?: boolean;
}

export const artifactsSectionCopy = {
  documentationIntro:
    "Full Markdown from the Antikythera repo `docs/` tree — the same curated set as the Engine Documentation dialog. Content is bundled in this site (no external links).",
  exampleIntro:
    "Below is a **full Implementation + QA bundle** for ticket HAL-1686 (Increase frontend unit test coverage, `apps/ui`): implementation run `run_7j8r82ayw` and QA run `run_tdutg7tmr`. Files were copied from a local `~/.hal/runs/` tree — re-copy them into `src/content/artifacts/` if you refresh the run.",
  exampleTemplateNote:
    "These layouts are **deliberately simple templates**: short sections, tables, and minimal prose so agents can fill them reliably. In production you can **fully customize** what each step emits—richer Markdown, stricter schemas, extra manifests, custom LLM prompts, and CI gates—so the same slots become as detailed as your audit or review process requires.",
} as const;

export interface PhilosophyItem {
  title: string;
  blurb: string;
}

export interface FutureProject {
  title: string;
  description: string;
  href?: string;
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export const hero = {
  name: "Phil",
  nameAccent: "Bearded",
  role: "Senior engineer and builder — creating AI-augmented development systems that are inspectable, structured, and production-ready.",
  /** Served from `public/` (Vite). */
  avatar: {
    src: "/phil-avatar.png",
    alt: "Stylized portrait — Phil with a red beard, green glasses, and purple shirt",
  },
  /** Shown at the top of the hero; update LinkedIn href if your public profile slug differs. */
  socialLinks: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/beardedphil",
      external: true,
    },
    {
      label: "Resume",
      href: "/philip-king-resume.pdf",
      external: true,
    },
    {
      label: "GitHub",
      href: "https://github.com/beardedphil",
      external: true,
    },
  ] satisfies CtaLink[],
  ctas: [
    { label: "Watch Demo", href: "#demo", primary: true },
    { label: "Documentation", href: "#documentation" },
  ] satisfies CtaLink[],
};

// ─── Demo video (YouTube) ────────────────────────────────────────────────────

export const demoVideo = {
  youtubeId: "q6QUWnIAXAY",
  watchUrl: "https://www.youtube.com/watch?v=q6QUWnIAXAY",
} as const;

// ─── Featured project: Antikythera Engine ────────────────────────────────────

export const featured = {
  label: "Flagship Project",
  title: "Antikythera Engine",
  summary:
    "A fully autonomous software-engineering pipeline that plans, implements, tests, and reviews code — with every decision inspectable and every artifact preserved. Built to prove that AI-augmented development can be rigorous, transparent, and humane.",
  highlights: [
    "PM, Implementation, QA, and Process Review agents — all inspectable",
    "Full artifact trail: plans, worklogs, diffs, evidence per ticket",
    "Tauri shell, bundled NATS — engine services and UI on your desktop; agents reach models through a gateway (not a rented control plane)",
    "Outcome-based learning loop that tracks and correlates rule changes",
    "Real-time kanban UI with drag-and-drop, chat, and LLM monitoring",
  ],
  ctas: [
    { label: "Watch Demo Video", href: "#demo", primary: true },
    { label: "Read the Docs", href: "#documentation" },
    { label: "View Artifacts", href: "#example-artifacts" },
  ] satisfies CtaLink[],
};

// ─── Philosophy ──────────────────────────────────────────────────────────────

export const philosophyIntro =
  "I build systems where you can see exactly what happened and why — because trust in automation comes from evidence, not faith.";

export const philosophy: PhilosophyItem[] = [
  {
    title: "Inspectability",
    blurb: "Every agent decision is logged. Every artifact is preserved. Nothing is a black box.",
  },
  {
    title: "Structure over vibes",
    blurb: "Preflight checks, mandatory plans, typed contracts — the system enforces rigor so the output earns trust.",
  },
  {
    title: "Proof of work",
    blurb: "Run artifacts, coverage gates, and outcome tracking replace \"it works on my machine\" with verifiable evidence.",
  },
  {
    title: "Documentation discipline",
    blurb: "Architecture docs, specs, and changelogs are first-class deliverables, not afterthoughts.",
  },
  {
    title: "Humane UX",
    blurb: "Progress streams, agent chat surfaces, and a readable board — built for clarity and review, not black-box automation.",
  },
];

// ─── Future projects ─────────────────────────────────────────────────────────

export const futureProjects: FutureProject[] = [
  {
    title: "More projects coming",
    description:
      "Additional open-source tools and systems in the AI-augmented engineering space — check back soon.",
  },
];

// ─── Footer ──────────────────────────────────────────────────────────────────

export const footer = {
  text: "© 2026 Phil",
  links: [
    { label: "GitHub", href: "https://github.com/beardedphil", external: true },
  ] satisfies CtaLink[],
};
