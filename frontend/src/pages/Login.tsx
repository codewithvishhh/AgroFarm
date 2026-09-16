import { motion } from "framer-motion";
import { Sprout } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../services/api";
import type { Role } from "../types";
import { ROLE_LABEL } from "../utils/navigation";

const ROLES: Role[] = [
  "FARMER",
  "COLLECTION",
  "WAREHOUSE",
  "TRANSPORT",
  "RETAILER",
];

const ROLE_HINT: Record<Role, string> = {
  FARMER: "Raise produce requests and follow them to the retailer",
  COLLECTION: "Accept requests, assign pickup, send produce onward",
  WAREHOUSE: "Stock, inventory history, allocation, and demand",
  TRANSPORT: "Fleet, live map, emergencies, and the control tower",
  RETAILER: "Incoming loads, shelf stock, and demand forecast",
};

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("FARMER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Enter your name to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      signIn(await authApi.login(name.trim(), role));
      navigate("/", { replace: true });
    } catch (exception) {
      setError((exception as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-soil-600/70 bg-soil-800/70 shadow-panel md:grid-cols-2"
      >
        <div className="hidden flex-col justify-between border-r border-soil-600/60 bg-soil-700/30 p-8 md:flex">
          <div>
            <p className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-husk">
              <Sprout size={24} className="text-crop" />
              Agro<span className="-ml-2 text-crop">Farm</span>
            </p>
            <p className="mt-2 text-sm text-moss">
              Smart Agricultural Supply Chain Platform
            </p>
          </div>

          <ul className="space-y-3 text-[12px] leading-relaxed text-moss">
            <li>Live GPS and cold chain readings from farm gate to shelf.</li>
            <li>Warehouse inventory with a full movement track record.</li>
            <li>Emergency assistance that finds the nearest help on the map.</li>
            <li>Demand forecasting from recorded daily sales.</li>
          </ul>

          <p className="text-[11px] text-moss/70">
            Hackathon prototype. Sign in with any name and pick a role.
          </p>
        </div>

        <div className="p-8">
          <p className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-husk md:hidden">
            <Sprout size={20} className="text-crop" />
            Agro<span className="-ml-2 text-crop">Farm</span>
          </p>
          <h1 className="mt-4 font-display text-lg text-husk md:mt-0">
            Enter AgroFarm
          </h1>
          <p className="mt-1 text-xs text-moss">
            Your role decides which dashboard opens.
          </p>

          <label className="mt-6 block text-[11px] text-moss">
            Enter your name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              placeholder="Rahul"
              className="mt-1 w-full rounded-lg border border-soil-600 bg-soil-900 px-3 py-2.5 text-sm text-husk outline-none transition-colors placeholder:text-moss/50 focus:border-crop/60"
            />
          </label>

          <fieldset className="mt-5">
            <legend className="text-[11px] text-moss">Select your role</legend>
            <div className="mt-2 grid gap-2">
              {ROLES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    role === option
                      ? "border-crop/45 bg-crop/10"
                      : "border-soil-600 hover:border-soil-500"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      role === option ? "text-crop" : "text-husk"
                    }`}
                  >
                    {ROLE_LABEL[option]}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-moss">
                    {ROLE_HINT[option]}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="mt-4 rounded-lg border border-rot/40 bg-rot/10 px-3 py-2 text-[11px] text-rot">
              {error}
            </p>
          )}

          <Button onClick={submit} disabled={busy} className="mt-6 w-full py-2.5">
            {busy ? "Opening" : "Enter AgroFarm"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
