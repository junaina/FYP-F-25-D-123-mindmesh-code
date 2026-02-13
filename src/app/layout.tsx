// /app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "@livekit/components-styles";
import { ThemeProvider } from "@/components/theme-provider";
import { cookies } from "next/headers";
import QueryProvider from "@/components/providers/QueryProvider";
import SWRProvider from "@/components/providers/SWRProvider";

const THEME_KEY = "mm-theme";

export const metadata: Metadata = {
  title: "mindmesh",
  description: "A project management tool powered by AI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // doing this for if the user explicitly chose light or dark
  const cookieStore = await cookies();
  // IMPORTANT: set this to the cookie your app uses to represent an authenticated session.
  // Examples: "mm-session", "next-auth.session-token", "__Secure-next-auth.session-token", etc.
  const isAuthenticated = Boolean(cookieStore.get("mm-session")?.value);

  const themeCookie = cookieStore.get(THEME_KEY)?.value as
    | "light"
    | "dark"
    | "system"
    | undefined;

  const htmlClass =
    themeCookie === "dark" ? "dark" : themeCookie === "light" ? "" : undefined;

  // no-flash script
  const noFlashScript = `
    (function () {
      try {
        var key='${THEME_KEY}';
        var fromLS = localStorage.getItem(key);
        var fromCookie = (document.cookie.match(new RegExp('(?:^|; )'+key+'=([^;]+)'))||[])[1];
        var t = fromLS || fromCookie || 'system';
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = t === 'dark' || (t !== 'light' && prefersDark);
        var cl = document.documentElement.classList;
        if (isDark) cl.add('dark'); else cl.remove('dark');
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SWRProvider isAuthenticated={isAuthenticated}>
            <QueryProvider>
              <div className="mx-auto px-4 py-6">{children}</div>
            </QueryProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
