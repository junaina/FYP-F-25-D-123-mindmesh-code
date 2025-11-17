// app/(app)/layout.tsx
import SidebarPortal from "@/components/sidebar/SidebarPortal";
import SocketInitializer from "@/components/SocketInitializer";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
       <SocketInitializer />
      <SidebarPortal />
      <div className="contents">{children}</div>
    </>
  );
}
