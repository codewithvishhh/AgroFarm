import { motion } from "framer-motion";
import { LogOut, Sprout, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useLive } from "../hooks/useLive";
import { NAVIGATION } from "../utils/navigation";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { session, signOut } = useAuth();
  const { connected } = useLive();
  const links = session ? NAVIGATION[session.role] : [];

  const content = (
    <>
      <div className="flex items-start justify-between px-2">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-husk">
            <Sprout size={18} className="text-crop" />
            Agro<span className="-ml-2 text-crop">Farm</span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-moss">
            Smart Agricultural Supply Chain Platform
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-moss lg:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={onClose}>
            {({ isActive }) => (
              <span className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-moss transition-colors hover:text-husk">
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg border border-crop/25 bg-crop/10"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <link.icon
                  size={15}
                  className={`relative ${isActive ? "text-crop" : ""}`}
                />
                <span className={`relative ${isActive ? "text-crop" : ""}`}>
                  {link.label}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-soil-600/70 bg-soil-700/50 px-3 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-crop" : "bg-rot"
              }`}
            />
            <p className="text-[11px] text-moss">
              {connected ? "Live feed connected" : "Reconnecting to feed"}
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-moss/70">
            GPS and sensor readings refresh every few seconds.
          </p>
        </div>

        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-moss transition-colors hover:text-rot"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-soil-600/60 bg-soil-800/60 px-4 py-6 lg:flex">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] flex lg:hidden">
          <div
            className="absolute inset-0 bg-soil-900/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-64 flex-col border-r border-soil-600 bg-soil-800 px-4 py-6"
          >
            {content}
          </motion.aside>
        </div>
      )}
    </>
  );
}
