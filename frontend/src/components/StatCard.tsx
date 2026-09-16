import { motion } from "framer-motion";

import { listItem } from "../animations/variants";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "crop" | "harvest" | "chill" | "rot" | "neutral";
}

const BARS: Record<string, string> = {
  crop: "bg-crop",
  harvest: "bg-harvest",
  chill: "bg-chill",
  rot: "bg-rot",
  neutral: "bg-soil-500",
};

export function StatCard({ label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <motion.article
      variants={listItem}
      className="relative overflow-hidden rounded-2xl border border-soil-600/70 bg-soil-800/70 p-5 shadow-panel"
    >
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${BARS[tone]} opacity-80`}
        aria-hidden
      />
      <p className="text-xs text-moss">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-husk">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-moss/80">{hint}</p>}
    </motion.article>
  );
}
