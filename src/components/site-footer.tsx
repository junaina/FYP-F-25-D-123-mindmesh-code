// components/site-footer.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t bg-background/70 backdrop-blur-md">
      {/* bottom row only */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} MindMesh. All rights reserved.</p>
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Twitter" className="hover:text-foreground">
            X/Twitter
          </a>
          <a href="#" aria-label="GitHub" className="hover:text-foreground">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
