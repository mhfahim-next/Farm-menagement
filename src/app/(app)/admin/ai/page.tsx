import type { Metadata } from "next";
import { AiSettingsForm } from "@/components/ai-settings-form";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { DEFAULT_MODELS, KEY_ENV, keyPresent, resolveConfig, type AiProvider } from "@/lib/ai/config";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { saveAiSettings, testAiConnection } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.ai.title") };
}

export default async function AdminAiPage() {
  const { supabase } = await requireSuperAdmin();
  const { t } = await getI18n();
  const { data } = await supabase.from("system_settings").select("ai_provider, ai_model, ai_base_url").eq("id", 1).maybeSingle();
  const cfg = resolveConfig(data);
  const providers: AiProvider[] = ["anthropic", "gemini", "custom"];

  return (
    <>
      <PageHeader title={t("admin.ai.title")} description={t("admin.ai.desc")} />
      <div className="grid max-w-2xl gap-6">
        <Card title={t("admin.ai.activeTitle")}>
          <p className="text-sm text-stone-700" data-testid="ai-active">
            {t("admin.ai.p." + cfg.provider as "admin.ai.p.anthropic")} · <code className="rounded bg-stone-100 px-1.5 py-0.5">{cfg.model || "—"}</code>
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm">
            {providers.map((p) => (
              <li key={p} className="flex flex-wrap items-center gap-2">
                <Badge tone={keyPresent(p) ? "green" : "amber"}>{keyPresent(p) ? t("admin.ai.keyFound") : t("admin.ai.keyMissing")}</Badge>
                <span className="text-stone-700">{t("admin.ai.p." + p as "admin.ai.p.anthropic")}</span>
                <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">{KEY_ENV[p]}</code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">{t("admin.ai.keyNote")}</p>
          <div className="mt-4">
            <ConfirmForm action={testAiConnection} fields={{}} label={t("admin.ai.test")} />
          </div>
        </Card>

        <Card title={t("admin.ai.formTitle")}>
          <AiSettingsForm
            action={saveAiSettings}
            initial={{ provider: cfg.provider, model: data?.ai_model ?? "", baseUrl: data?.ai_base_url ?? "" }}
            defaults={DEFAULT_MODELS}
          />
        </Card>
      </div>
    </>
  );
}
