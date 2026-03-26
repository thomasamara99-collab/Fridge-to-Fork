"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-bg px-6 pb-10 pt-14">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="font-display text-3xl text-text-primary">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Start building meals that fit your day perfectly.
          </p>
        </div>
        <SignUp
          path="/signup"
          routing="path"
          signInUrl="/login"
          afterSignUpUrl="/onboarding/step-1"
        />
      </div>
    </main>
  );
}
