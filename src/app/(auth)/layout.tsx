import { FarmScene } from "@/components/farm-scene";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { getI18n } from "@/lib/i18n/server";

/** Login / sign-up: a FarmFlows welcome panel on the left (wide screens) and the form on the right. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const { t } = await getI18n();
  const points = [1, 2, 3, 4] as const;

  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Form side */}
      <div className="relative flex flex-col px-4 py-6 sm:px-8 lg:order-2">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-stone-400">{t("landing.footer", { year: new Date().getFullYear() })}</p>
      </div>

      {/* Welcome panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br lg:order-1 from-emerald-700 via-emerald-800 to-emerald-950 text-white lg:flex lg:flex-col">
        <AuroraBackground intensity="medium" />
        <div className="relative flex-1 px-12 pt-16 xl:px-16">
          <BlurFade>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-lime-200 ring-1 ring-white/20">
              🌾 {t("footer.madeFor")}
            </p>
          </BlurFade>
          <h2 className="mt-5 max-w-md text-3xl font-bold leading-tight tracking-tight xl:text-4xl">{t("auth.panel.title")}</h2>
          <p className="mt-3 max-w-md text-white/80">{t("auth.panel.body")}</p>
          <ul className="mt-8 grid max-w-md gap-3">
            {points.map((n, i) => (
              <BlurFade key={n} delay={0.08 * (i + 1)}>
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime-300 text-xs font-bold text-emerald-900">
                    ✓
                  </span>
                  {t(`auth.panel.p${n}`)}
                </li>
              </BlurFade>
            ))}
          </ul>

          {/* Small sample of the dashboard (illustration). */}
          <BlurFade delay={0.4}>
            <div className="mt-10 max-w-md rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
              <p className="text-[11px] uppercase tracking-wider text-white/60">{t("auth.panel.example")}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {(
                  [
                    ["🥛", t("auth.panel.milk")],
                    ["🥚", t("auth.panel.eggs")],
                    ["💉", t("auth.panel.due")],
                  ] as const
                ).map(([icon, label]) => (
                  <div key={label} className="rounded-xl bg-white/10 px-2 py-3">
                    <div aria-hidden className="text-xl">
                      {icon}
                    </div>
                    <div className="mt-1 text-xs text-white/85">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>
        </div>
        <FarmScene className="relative h-44 w-full xl:h-52" />
      </aside>
    </div>
  );
}
