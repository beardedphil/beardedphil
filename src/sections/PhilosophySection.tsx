import { philosophyIntro, philosophy } from "../content/site";

export function PhilosophySection() {
  return (
    <section className="section" id="philosophy">
      <span className="section-label">How I Build</span>
      <h2 className="section-title">Engineering principles</h2>
      <div className="philosophy-content">
        <p>{philosophyIntro}</p>
        <ul className="philosophy-list">
          {philosophy.map((p) => (
            <li key={p.title} className="philosophy-item">
              <strong>{p.title}</strong>
              <span>{p.blurb}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
