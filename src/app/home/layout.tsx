import Sidebar from "@/components/sidebar";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (fixed + scrollable) */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 ml-64 p-6">{children}</div>
    </div>
  );
}
