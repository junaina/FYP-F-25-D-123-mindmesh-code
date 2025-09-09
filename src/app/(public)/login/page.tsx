// src/app/(public)/login/page.tsx
import SiteNavbar from "@/components/site-navbar";
import LoginForm from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <SiteNavbar />
      {/* Match signup width: max-w-xl = 36rem (576px) */}
      <main className="relative mx-auto w-full max-w-xl px-4 sm:px-6 pb-16 pt-10 sm:pt-16">
        <h1 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Log in
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="underline">
            Create an account
          </Link>
        </p>

        {/* No extra width here — inherit container width */}
        <section className="mt-8 w-full">
          <LoginForm />
        </section>
      </main>
    </>
  );
}
