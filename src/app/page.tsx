// app/page.tsx
import BackgroundGrid from "@/components/background-grid";
import SiteNavbar from "@/components/site-navbar";
import Hero from "@/components/sections/hero";
import ValueProps from "@/components/sections/value-props";
import FeatureHighlights from "@/components/sections/feature-highlights";
import HowItWorks from "@/components/sections/how-it-works";
import SiteFooter from "@/components/site-footer";
export default function HomePage() {
  return (
    <main className="relative">
      <BackgroundGrid />
      <SiteNavbar />
      <Hero />
      <ValueProps />
      <FeatureHighlights />
      <HowItWorks />
      <SiteFooter />
    </main>
  );
}
