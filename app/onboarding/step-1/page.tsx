"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import StepLayout from "../../../components/onboarding/StepLayout";
import { useOnboardingStore } from "../../../store/onboardingStore";

const schema = z.object({
  name: z.string().min(1, "Required"),
  age: z.number().min(14).max(90),
  sex: z.enum(["male", "female", "other"]),
  weightKg: z.number().min(35).max(250),
  heightCm: z.number().min(130).max(230),
});

type FormData = z.infer<typeof schema>;

export default function Step1Page() {
  const router = useRouter();
  const { setStep1, name, age, sex, weightKg, heightCm } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: name || "",
      age: age ?? 24,
      sex: (sex || "female") as FormData["sex"],
      weightKg: weightKg ?? 65,
      heightCm: heightCm ?? 168,
    },
  });

  const selectedSex = watch("sex");

  const onSubmit = (data: FormData) => {
    setStep1(data);
    router.push("/onboarding/step-2");
  };

  return (
    <StepLayout
      step={1}
      total={6}
      title="Your basics"
      subtitle="Tell us a little about your body stats so we can set smart targets."
      ctaLabel="Continue"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-text-tertiary">
            First name
          </span>
          <input
            {...register("name")}
            className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
          />
          {errors.name ? (
            <p className="mt-1 text-xs text-accent-text">
              {errors.name.message}
            </p>
          ) : null}
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Age
            </span>
            <input
              type="number"
              {...register("age", { valueAsNumber: true })}
              className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            {errors.age ? (
              <p className="mt-1 text-xs text-accent-text">
                {errors.age.message}
              </p>
            ) : null}
          </label>

          <div>
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Sex
            </span>
            <input type="hidden" {...register("sex")} />
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-md bg-surface-2 p-1">
              {(["male", "female", "other"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setValue("sex", option)}
                  className={`rounded-md px-2 py-2 text-xs font-medium capitalize ${
                    selectedSex === option
                      ? "bg-white text-text-primary shadow"
                      : "text-text-secondary"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Weight (kg)
            </span>
            <input
              type="number"
              {...register("weightKg", { valueAsNumber: true })}
              className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            {errors.weightKg ? (
              <p className="mt-1 text-xs text-accent-text">
                {errors.weightKg.message}
              </p>
            ) : null}
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Height (cm)
            </span>
            <input
              type="number"
              {...register("heightCm", { valueAsNumber: true })}
              className="mt-2 w-full rounded-md border border-transparent bg-surface-2 px-4 py-3 text-sm text-text-primary outline-none focus:border-accent focus:bg-white"
            />
            {errors.heightCm ? (
              <p className="mt-1 text-xs text-accent-text">
                {errors.heightCm.message}
              </p>
            ) : null}
          </label>
        </div>
      </div>
    </StepLayout>
  );
}
