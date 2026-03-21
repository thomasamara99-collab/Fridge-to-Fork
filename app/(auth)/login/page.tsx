"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/swipe",
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <main className="min-h-screen bg-bg px-6 pb-10 pt-14">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-3xl text-text-primary">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Log in to pick up where you left off.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-card border border-border bg-surface p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06),_0_0_0_0.5px_rgba(0,0,0,0.04)]"
        >
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:bg-white"
            />
          </label>

          {error ? (
            <p className="text-sm text-accent-text">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-md bg-accent px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          New here?{" "}
          <Link href="/signup" className="font-medium text-accent">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
