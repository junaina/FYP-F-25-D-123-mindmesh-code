// src/app/signup/page.tsx
import BackgroundGrid from "@/components/background-grid";
import SiteNavbar from "@/components/site-navbar";
import SignupForm from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="relative">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md py-10 md:py-16">
          <h1 className="mb-6 text-center  text-3xl font-semibold tracking-tight md:text-4xl">
            Create your account
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Already have one?{" "}
            <a className="underline" href="/login">
              Log in
            </a>
          </p>

          <SignupForm />
        </div>
      </section>
    </main>
  );
}
