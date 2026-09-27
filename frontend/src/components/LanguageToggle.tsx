import { useLanguage } from "../i18n/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      aria-label={t("Select language")}
      className="inline-flex shrink-0 items-center rounded-xl border border-husk/12 bg-husk/4 p-0.5"
      role="group"
    >
      <button
        type="button"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
        className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${
          language === "en" ? "bg-crop/18 text-crop" : "text-moss hover:text-husk"
        }`}
      >
        English
      </button>
      <button
        type="button"
        aria-pressed={language === "hi"}
        onClick={() => setLanguage("hi")}
        className={`rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${
          language === "hi" ? "bg-crop/18 text-crop" : "text-moss hover:text-husk"
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}