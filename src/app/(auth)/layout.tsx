import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuroraBackground } from "@/components/velora/aurora-background";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-stone-50 px-4 py-12">
      <AuroraBackground intensity="subtle" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="relative mb-8">
        <Logo />
      </div>
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 shadow-xl shadow-emerald-900/5">
        {children}
      </div>
    </div>
  );
}
