import type { ReactNode } from "react";

import { useLanguage } from "../i18n/LanguageContext";

interface EmptyStateProps {
  title: string;
  hint: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crop/8 blur-3xl"
      />
      <p className="relative font-display text-sm text-husk">{t(title)}</p>
      <p className="relative max-w-sm text-xs text-moss">{t(hint)}</p>
      {action && <div className="relative mt-3">{action}</div>}
    </div>
  );
}
