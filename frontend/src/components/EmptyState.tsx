import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  hint: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <p className="font-display text-sm text-husk">{title}</p>
      <p className="max-w-sm text-xs text-moss">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
