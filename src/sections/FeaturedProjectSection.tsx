import { featured, demoVideo } from "../content/site";
import type { CtaLink } from "../content/site";

function LinkButton({ cta }: { cta: CtaLink }) {
  return (
    <a
      className={`btn${cta.primary ? " btn-primary" : ""}`}
      href={cta.href}
      {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {cta.label}
    </a>
  );
}

export function FeaturedProjectSection() {
  return (
    <section className="section" id="featured">
      <span className="section-label">{featured.label}</span>
      <div className="featured">
        <div className="featured-body">
          <h3>{featured.title}</h3>
          <p>{featured.summary}</p>
          <ul className="featured-highlights">
            {featured.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <div className="featured-ctas">
            {featured.ctas.map((c) => (
              <LinkButton key={c.label} cta={c} />
            ))}
          </div>
        </div>
        <div className="glass-card" style={{ alignSelf: "start" }}>
          <div className="glass-card-tag">stack</div>
          <p className="glass-card-desc" style={{ marginBottom: "0.75rem" }}>
            Desktop stack: Tauri shell, bundled NATS, kanban UI, agent chat, and
            monitoring — the engine runs on your machine; there is no separate
            cloud dashboard or control plane.
          </p>
          <p className="glass-card-desc" style={{ marginBottom: "0.75rem" }}>
            Agents{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              call out to LLMs
            </strong>{" "}
            for planning and execution, with traffic surfaced in the UI. The{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              implementation
            </strong>{" "}
            agent currently expects{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              hosted / cloud-accessible
            </strong>{" "}
            models — local models (e.g. Ollama) for that path are not supported
            yet. Other features may still use a local Ollama instance when you
            configure one.
          </p>
          <p
            className="glass-card-desc"
            style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
          >
            Built with Go services, React + Vite UI, NATS event bus, and
            automated process-review learning loop.
          </p>
        </div>
      </div>

      <div className="demo-video-block" id="demo">
        <span className="section-label">Demo</span>
        <h3 className="demo-video-heading">See it in action</h3>
        <div className="video-embed">
          <iframe
            src={`https://www.youtube.com/embed/${demoVideo.youtubeId}`}
            title="Antikythera Engine demo video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <p className="video-embed-foot">
          <a
            href={demoVideo.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open on YouTube
          </a>
        </p>
      </div>
    </section>
  );
}
