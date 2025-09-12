import SiteNavbar from "@/components/site-navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteNavbar />
      <main>{children}</main>
    </div>
  );
}
