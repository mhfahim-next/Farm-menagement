import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Field, Input, Textarea } from "@/components/ui";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { getI18n } from "@/lib/i18n/server";
import { getSiteInfo, safe } from "@/lib/public-data";
import { sendContactMessage } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("contact.title"), description: t("contact.desc"), alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const { t, locale } = await getI18n();
  const info = await safe(() => getSiteInfo(), null);
  const bn = locale === "bn";
  const address = bn ? info?.address_bn ?? info?.address_en : info?.address_en ?? info?.address_bn;
  const hours = bn ? info?.office_hours_bn ?? info?.office_hours_en : info?.office_hours_en ?? info?.office_hours_bn;
  const wa = info?.whatsapp?.replace(/[^\d]/g, "");

  const cards = [
    info?.contact_email && { icon: "✉️", label: t("contact.email"), value: info.contact_email, href: `mailto:${info.contact_email}` },
    info?.contact_phone && { icon: "📞", label: t("contact.phone"), value: info.contact_phone, href: `tel:${info.contact_phone.replace(/[^\d+]/g, "")}` },
    wa && { icon: "💬", label: "WhatsApp", value: info?.whatsapp ?? "", href: `https://wa.me/${wa}` },
    address && { icon: "📍", label: t("contact.address"), value: address, href: null },
  ].filter(Boolean) as { icon: string; label: string; value: string; href: string | null }[];

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-stone-50">
          <AuroraBackground intensity="subtle" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:py-20">
            <BlurFade>
              <p className="text-sm font-semibold text-emerald-700">{t("contact.kicker")}</p>
            </BlurFade>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">{t("contact.title")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-stone-600">{t("contact.desc")}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="grid content-start gap-4">
            {cards.map((c, i) => (
              <BlurFade key={c.label} delay={0.06 * i}>
                <SpotlightCard className="border-stone-200 p-5">
                  <div className="flex items-start gap-4">
                    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xl">
                      {c.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-stone-500">{c.label}</p>
                      {c.href ? (
                        <a href={c.href} className="break-words font-semibold text-stone-900 hover:text-emerald-700" data-testid={`contact-${c.label}`}>
                          {c.value}
                        </a>
                      ) : (
                        <p className="break-words font-semibold text-stone-900">{c.value}</p>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              </BlurFade>
            ))}
            {hours && (
              <p className="px-1 text-sm text-stone-500">
                🕘 {t("contact.hours")}: <span className="font-medium text-stone-700">{hours}</span>
              </p>
            )}
          </div>

          <BlurFade delay={0.1}>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-stone-900">{t("contact.formTitle")}</h2>
              <p className="mt-1 text-sm text-stone-500">{t("contact.formDesc")}</p>
              <ActionForm action={sendContactMessage} submitLabel={t("contact.send")} className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("common.name")}>
                    <Input name="name" autoComplete="name" required maxLength={120} />
                  </Field>
                  <Field label={t("contact.phone")}>
                    <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} />
                  </Field>
                </div>
                <Field label={t("contact.email")} hint={t("contact.replyHint")}>
                  <Input name="email" type="email" autoComplete="email" maxLength={200} />
                </Field>
                <Field label={t("contact.subject")}>
                  <Input name="subject" maxLength={160} />
                </Field>
                <Field label={t("contact.message")}>
                  <Textarea name="message" rows={5} required minLength={5} maxLength={4000} />
                </Field>
                {/* Honeypot: hidden from people, filled by bots. */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Website <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
              </ActionForm>
            </div>
          </BlurFade>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
