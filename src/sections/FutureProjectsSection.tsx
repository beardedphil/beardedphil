import { futureProjects } from "../content/site";

export function FutureProjectsSection() {
  return (
    <section className="section" id="projects">
      <span className="section-label">More Work</span>
      <h2 className="section-title">What's next</h2>
      <div className="future-strip">
        {futureProjects.map((p) => (
          <div key={p.title} className="glass-card future-card">
            <h3 className="glass-card-title">{p.title}</h3>
            <p className="glass-card-desc">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
