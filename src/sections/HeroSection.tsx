import { hero } from "../content/site";
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

export function HeroSection() {
  return (
    <section className="section hero fade-in-up">
      <h1 className="hero-name">
        <span className="accent">{hero.nameAccent}</span>
        {hero.name}
      </h1>
      <p className="hero-role">{hero.role}</p>
      <div className="hero-ctas">
        {hero.ctas.map((c) => (
          <LinkButton key={c.label} cta={c} />
        ))}
      </div>
    </section>
  );
}
