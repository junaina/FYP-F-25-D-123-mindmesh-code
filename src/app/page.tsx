import BackgroundGrid from "@/components/background-grid";
import Hero from "@/components/sections/hero";
import SiteNavbar from "@/components/site-navbar";
export default function HomePage() {
  return (
    <main className="relative">
      <BackgroundGrid />
      <SiteNavbar />
      <Hero />
    </main>
  );
}
// this is hero or landing page