"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Values = { email: string; password: string };

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Values>({
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: Values) => {
    // TODO: call your API here
    console.log(values);
  };
  const onContinueWithGoogle = () => {
    console.log("Continue with Google clicked");
  };

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
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 gap-2"
        onClick={onContinueWithGoogle}
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </Button>
    </form>
  );
}
