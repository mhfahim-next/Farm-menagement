"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select } from "./ui";

type Provider = "anthropic" | "gemini" | "custom";

/** Super admin: choose which AI service answers the farmers' assistant. */
export function AiSettingsForm({
  action,
  initial,
  defaults,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: { provider: Provider; model: string; baseUrl: string };
  defaults: Record<Provider, string>;
}) {
  const { t } = useI18n();
  const [provider, setProvider] = useState<Provider>(initial.provider);

  return (
    <ActionForm action={action} submitLabel={t("admin.ai.save")}>
      <Field label={t("admin.ai.provider")}>
        <Select
          name="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          options={[
            { value: "anthropic", label: t("admin.ai.p.anthropic") },
            { value: "gemini", label: t("admin.ai.p.gemini") },
            { value: "custom", label: t("admin.ai.p.custom") },
          ]}
        />
      </Field>
      <Field label={t("admin.ai.model")} hint={provider === "custom" ? t("admin.ai.modelHintCustom") : t("admin.ai.modelHint", { model: defaults[provider] })}>
        <Input key={provider} name="model" defaultValue={provider === initial.provider ? initial.model : ""} placeholder={defaults[provider]} maxLength={100} required={provider === "custom"} />
      </Field>
      {provider === "custom" && (
        <Field label={t("admin.ai.baseUrl")} hint={t("admin.ai.baseUrlHint")}>
          <Input name="base_url" type="url" defaultValue={initial.baseUrl} placeholder="https://api.groq.com/openai/v1" required />
        </Field>
      )}
    </ActionForm>
  );
}
