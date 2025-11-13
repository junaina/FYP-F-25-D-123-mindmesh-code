// app/(app)/layout.tsx
import SidebarPortal from "@/components/sidebar/SidebarPortal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarPortal />
      <main>
        <div className="contents">{children}</div>
      </main>
    </>
  );
}
