// src/components/auth/signup-form.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// removed Eye/EyeOff imports
import { CheckCircle2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SignupSchema = z
  .object({
    firstName: z.string().min(2, "first name must be at least 2 characters"),
    lastName: z.string().min(2, "last name must be at least 2 characters"),
    email: z.string().email("invalid email address"),
    password: z
      .string()
      .min(8, "at least 8 characters")
      .regex(/[A-Z]/, "add at least one uppercase letter")
      .regex(/[a-z]/, "add at least one lowercase letter")
      .regex(/\d/, "add at least one number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "passwords don't match",
  });

type FormValues = z.infer<typeof SignupSchema>;

// tiny Google "G" icon (no extra assets)
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" {...props}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.66 0 6.24 1.58 7.67 2.9l5.22-5.1C33.84 4.1 29.43 2 24 2 14.8 2 6.9 7.3 3.3 15l6.8 5.3C12 14 17.48 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.14-2.77-.44-3.98H24v7.56h12.8c-.26 1.9-1.65 4.77-4.75 6.7l7.31 5.67c4.27-3.94 6.14-9.73 6.14-15.95z"
      />
      <path
        fill="#FBBC05"
        d="M10.1 28.3A14.46 14.46 0 019.5 24c0-1.5.26-2.96.67-4.3l-6.87-5.3A22 22 0 002 24c0 3.56.86 6.93 2.36 9.9l6.74-5.6z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.43 0 10-1.78 13.33-4.85l-7.31-5.67c-2.01 1.3-4.72 2.2-8.02 2.2-6.52 0-12.01-4.5-13.23-10.53l-6.8 5.3C6.9 40.7 14.8 46 24 46z"
      />
    </svg>
  );
}

export default function SignupForm() {
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting }, // no errors used for visual text
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirm: "",
    },
    mode: "onBlur",
  });

  const password = watch("password");
  const confirm = watch("confirm");

  // criteria booleans
  const hasLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  // simple strength 0–4
  const strength =
    (hasLen ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasLower ? 1 : 0) +
    (hasNumber ? 1 : 0);

  const onSubmit = async (values: FormValues) => {
    console.log(values);
    setSubmitted(true);
    reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirm: "",
    });
  };

  const onContinueWithGoogle = () => {
    console.log("Continue with Google clicked");
    // Wire up later (e.g. NextAuth: window.location.href = "/api/auth/signin/google")
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* First / Last name */}
      <div className="grid gap-2 md:grid-cols-2 md:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            {...register("firstName")}
            placeholder="John"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            {...register("lastName")}
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Email */}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          {...register("email")}
          placeholder="you@example.com"
        />
      </div>

      {/* Password */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        <Input
          id="password"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          {...register("password")}
          className="pr-10"
        />

        {/* Strength meter */}
        <div className="mt-1 grid grid-cols-4 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded ${
                i < strength ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Criteria list (green when met) */}
        <ul
          id="pw-criteria"
          className="mt-2 grid grid-cols-1 gap-y-1 gap-x-6 text-xs sm:grid-cols-2"
          aria-live="polite"
        >
          {[
            { ok: hasLen, label: "at least 8 characters" },
            { ok: hasUpper, label: "uppercase letter (A–Z)" },
            { ok: hasLower, label: "lowercase letter (a–z)" },
            { ok: hasNumber, label: "number (0–9)" },
          ].map((r) => (
            <li
              key={r.label}
              className={`flex items-center gap-2 ${
                r.ok ? "text-emerald-500" : "text-muted-foreground"
              }`}
            >
              {r.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              <span>{r.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="confirm">Confirm password</Label>
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
        <Input
          id="confirm"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          {...register("confirm")}
          className="pr-10"
          aria-invalid={Boolean(confirm) && confirm !== password}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full my-0" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      {/* Divider */}
      <div className="my-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Continue with Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 gap-2"
        onClick={onContinueWithGoogle}
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </Button>

      {submitted && (
        <p className="text-center text-sm text-green-600 dark:text-green-400">
          account created
        </p>
      )}
    </form>
  );
}
