import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Logo } from "@/components/logo";
import { Field, Input, Select } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createFarm } from "./actions";

export const metadata: Metadata = { title: "Set up your farm" };

const currencies = [
  { value: "BDT", label: "BDT — Bangladeshi Taka" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
];

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("farm_members")
    .select("farm_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-stone-50 px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">Set up your farm</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">
          You can change these later in Settings.
        </p>
        <ActionForm action={createFarm} submitLabel="Create farm" fullWidthSubmit>
          <Field label="Farm name">
            <Input name="name" placeholder="e.g. Green Valley Dairy" required minLength={2} />
          </Field>
          <Field label="Location">
            <Input name="location" placeholder="District / village" />
          </Field>
          <Field label="Currency">
            <Select name="currency" defaultValue="BDT" options={currencies} />
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-medium text-stone-700">
              What do you farm?
            </legend>
            <ModuleOption name="has_dairy" title="Cattle & dairy" body="Cows, calves, milk, breeding, health" />
            <ModuleOption name="has_layer" title="Layer chickens" body="Flocks, eggs, feed, mortality" />
          </fieldset>
        </ActionForm>
      </div>
    </div>
  );
}

function ModuleOption({ name, title, body }: { name: string; title: string; body: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
      <input type="checkbox" name={name} defaultChecked className="mt-1 accent-emerald-700" />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-stone-500">{body}</span>
      </span>
    </label>
  );
}
