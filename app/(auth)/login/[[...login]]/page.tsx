"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-bg px-6 pb-10 pt-14">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-text-primary">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Log in to pick up where you left off.
          </p>
        </div>
        <SignIn path="/login" routing="path" signUpUrl="/signup" />
      </div>
    </main>
  );
}
