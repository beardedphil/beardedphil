import { HeroSection } from "../sections/HeroSection";
import { FeaturedProjectSection } from "../sections/FeaturedProjectSection";
import { ArtifactsSection } from "../sections/ArtifactsSection";
import { PhilosophySection } from "../sections/PhilosophySection";
import { FutureProjectsSection } from "../sections/FutureProjectsSection";
import { SiteFooter } from "../sections/SiteFooter";

export function PortfolioPage() {
  return (
    <div className="page">
      <HeroSection />
      <FeaturedProjectSection />
      <hr className="section-divider" />
      <ArtifactsSection />
      <hr className="section-divider" />
      <PhilosophySection />
      <hr className="section-divider" />
      <FutureProjectsSection />
      <SiteFooter />
    </div>
  );
}
