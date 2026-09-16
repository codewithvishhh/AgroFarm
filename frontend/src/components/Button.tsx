import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "quiet";

const STYLES: Record<Variant, string> = {
  primary: "bg-crop text-soil-900 hover:bg-crop/90 font-medium",
  ghost:
    "border border-soil-500 bg-transparent text-husk hover:border-crop/60 hover:text-crop",
  danger: "border border-rot/40 bg-rot/10 text-rot hover:bg-rot/20",
  quiet: "text-moss hover:text-husk",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${STYLES[variant]} ${className}`}
    />
  );
}
