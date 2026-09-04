import { setLocale } from "@/app/actions/locale";
import type { LanguageOption } from "@/db/schema/settings";

export function LanguageSwitcher({
  languages,
  current,
}: {
  languages: LanguageOption[];
  current: string;
}) {
  const active = languages.filter((language) => language.isActive !== false);
  if (active.length < 2) return null;

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {active.map((language) => (
        <form action={setLocale} key={language.code}>
          <input type="hidden" name="locale" value={language.code} />
          <button
            type="submit"
            className={
              language.code === current
                ? "rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-paper"
                : "rounded-full px-2.5 py-1 text-xs font-semibold text-muted hover:bg-mist hover:text-brand"
            }
            aria-pressed={language.code === current}
            lang={language.code}
          >
            {language.code.toUpperCase()}
            <span className="sr-only"> {language.name}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
