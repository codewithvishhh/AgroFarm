import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-soil-600/70 bg-soil-800/70 shadow-panel ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-soil-600/60 px-5 py-4">
          <div>
            {title && (
              <h2 className="font-display text-sm font-semibold tracking-tight text-husk">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-moss">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
