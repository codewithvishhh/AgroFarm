import { Bell, Menu, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useLive } from "../hooks/useLive";
import { NAVIGATION, ROLE_LABEL } from "../utils/navigation";
import { NotificationPanel } from "./NotificationPanel";

interface TopbarProps {
  online: boolean;
  onMenu: () => void;
}

export function Topbar({ online, onMenu }: TopbarProps) {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const { unreadCount, connected } = useLive();
  const [open, setOpen] = useState(false);

  const link = session
    ? NAVIGATION[session.role].find((item) => item.to === pathname)
    : undefined;
  const title =
    link?.label ??
    (pathname.startsWith("/shipments/") ? "Shipment detail" : "AgroFarm");

  return (
    <header className="relative flex items-center justify-between gap-3 border-b border-soil-600/60 bg-soil-900/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg border border-soil-600 p-2 text-moss lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-semibold tracking-tight text-husk">
            {title}
          </h1>
          <p className="truncate text-[11px] text-moss">
            {session
              ? `${session.name} · ${ROLE_LABEL[session.role]}`
              : "AgroFarm"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] sm:inline-flex ${
            online
              ? "border-soil-600 text-moss"
              : "border-harvest/40 bg-harvest/10 text-harvest"
          }`}
          title={
            online
              ? "Connected to the AgroFarm API"
              : "Offline. Cached dashboard data is shown."
          }
        >
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          {online
            ? connected
              ? "Online"
              : "Online, feed reconnecting"
            : "Offline — cached data"}
        </span>

        <button
          onClick={() => setOpen((value) => !value)}
          className="relative rounded-lg border border-soil-600 p-2 text-husk transition-colors hover:border-crop/50 hover:text-crop"
          aria-label="Open notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-harvest px-1 text-[10px] font-medium text-soil-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <NotificationPanel open={open} onClose={() => setOpen(false)} />
      </div>
    </header>
  );
}
