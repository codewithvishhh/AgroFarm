function currentLocale(): string {
  return typeof window !== "undefined" &&
    window.localStorage.getItem("agrofarm-language") === "hi"
    ? "hi-IN"
    : "en-IN";
}

export function formatRoute(source: string, destination: string, language: "en" | "hi"): string {
  return language === "hi"
    ? `${source} से ${destination} तक`
    : `${source} to ${destination}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return date.toLocaleString(currentLocale(), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return date.toLocaleDateString(currentLocale(), { day: "2-digit", month: "short" });
}

export function timeAgo(value: string): string {
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const hindi = currentLocale() === "hi-IN";
  if (seconds < 60) return hindi ? "अभी" : "just now";
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return hindi ? `${minutes} मिनट पहले` : `${minutes}m ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return hindi ? `${hours} घंटे पहले` : `${hours}h ago`;
  }
  const days = Math.floor(seconds / 86400);
  return hindi ? `${days} दिन पहले` : `${days}d ago`;
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString(currentLocale(), {
    maximumFractionDigits: 1,
  })} ${unit}`;
}

export function formatRupees(value: number): string {
  return `₹${value.toLocaleString(currentLocale(), { maximumFractionDigits: 0 })}`;
}

export function formatEta(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  const hindi = currentLocale() === "hi-IN";
  if (minutes < 60) return hindi ? `${Math.round(minutes)} मिनट` : `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hindi ? `${hours} घंटे ${rest} मिनट` : `${hours}h ${rest}m`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
