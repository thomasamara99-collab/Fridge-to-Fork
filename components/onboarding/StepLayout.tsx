"use client";

import Link from "next/link";

type StepLayoutProps = {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

export default function StepLayout({
  step,
  total,
  title,
  subtitle,
  ctaLabel,
  onSubmit,
  onBack,
  disabled,
  children,
}: StepLayoutProps) {
  const progress = Math.round((step / total) * 100);
  const Container = onSubmit ? "form" : "div";

  return (
    <Container
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-6 pb-24 pt-8"
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        <div className="h-1 w-full rounded-full bg-surface-2">
          <div
            className="h-1 rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div>
          <h1 className="font-display text-3xl text-text-primary">{title}</h1>
          <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1">{children}</div>

      <div className="sticky bottom-0 mt-auto bg-bg pb-6 pt-2">
        {onBack ? (
          <Link
            href={onBack}
            className="mb-3 inline-block text-sm text-text-tertiary"
          >
            Back
          </Link>
        ) : null}
        <button
          type={onSubmit ? "submit" : "button"}
          className="w-full rounded-md bg-accent px-5 py-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
        >
          {ctaLabel}
        </button>
      </div>
    </Container>
  );
}
