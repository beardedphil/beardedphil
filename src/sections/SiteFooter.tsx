import { footer } from "../content/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      {footer.text}
      {footer.links.length > 0 && (
        <>
          {" · "}
          {footer.links.map((l, i) => (
            <span key={l.label}>
              {i > 0 && " · "}
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {l.label}
              </a>
            </span>
          ))}
        </>
      )}
    </footer>
  );
}
