import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cookies } from "next/headers";

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
          <div className="mx-auto px-4 py-6">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
