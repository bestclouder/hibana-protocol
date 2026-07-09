"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-actions";

const inputClasses =
  "w-full rounded-md border border-sand bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 placeholder:text-stone/60";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn(new FormData(e.currentTarget));
    setPending(false);
    if (res.ok) {
      router.push("/feed");
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" autoComplete="email" className={inputClasses} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <input name="password" type="password" autoComplete="current-password" className={inputClasses} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ink text-paper px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-stone text-center">
        New here?{" "}
        <Link href="/auth/signup" className="font-medium text-ink underline decoration-sand">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signUp(new FormData(e.currentTarget));
    setPending(false);
    if (res.ok) {
      if (res.data?.needsConfirmation) setConfirmationSent(true);
      else {
        router.push("/feed");
        router.refresh();
      }
    } else {
      setError(res.message);
    }
  }

  if (confirmationSent) {
    return (
      <div className="text-center space-y-3">
        <p aria-hidden className="text-3xl">✉️</p>
        <h2 className="font-display text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-stone">
          We sent you a confirmation link. Click it, then{" "}
          <Link href="/auth/login" className="font-medium text-ink underline decoration-sand">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Your name</span>
        <input name="full_name" autoComplete="name" className={inputClasses} maxLength={100} />
        <span className="block text-xs text-stone">Shown on your posts and comments.</span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" autoComplete="email" className={inputClasses} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <input name="password" type="password" autoComplete="new-password" className={inputClasses} />
        <span className="block text-xs text-stone">At least 8 characters.</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ember text-white px-4 py-2.5 text-sm font-semibold hover:bg-ember-deep disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-stone text-center">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-ink underline decoration-sand">
          Sign in
        </Link>
      </p>
    </form>
  );
}
