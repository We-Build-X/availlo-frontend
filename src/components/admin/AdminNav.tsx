import { Link } from "@tanstack/react-router";
import {
  Widget4,
  Calendar,
  Buildings2,
  Settings,
  Tuning,
  HeadphonesRound,
} from "@solar-icons/react";

interface AdminNavProps {
  showLogo?: boolean;
}

const TOP_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Widget4 },
  { href: "/admin/timetables", label: "Timetables", icon: Calendar },
  { href: "/admin/venues", label: "Venues", icon: Buildings2 },
  { href: "/admin/overrides", label: "Overrides", icon: Tuning },
];

const BOTTOM_LINKS = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/support", label: "Support", icon: HeadphonesRound },
];

export function AdminNav({ showLogo = false }: AdminNavProps) {
  return (
    <div className="flex flex-col h-full">
      {showLogo && (
        <div className="flex items-center gap-3 p-4 border-b border-black/10">
          <img src="/favicon-dark-bg.png" className="w-10" alt="Availlo" />
          <h2 className="font-bold text-2xl">Availlo</h2>
        </div>
      )}
      <nav className="flex-1 w-full flex flex-col justify-between p-4">
        <div className="space-y-2 w-full">
          {TOP_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="p-3 rounded-lg flex-1 flex gap-3 items-center text-base transition-colors"
            >
              {({ isActive }) => (
                <span
                  className={`flex gap-3 items-center w-full rounded-lg p-3 -m-3 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-primary/10"
                  }`}
                >
                  <item.icon
                    size={22}
                    weight={isActive ? "Bold" : "Outline"}
                  />
                  <span className={isActive ? "font-semibold" : ""}>
                    {item.label}
                  </span>
                </span>
              )}
            </Link>
          ))}
        </div>
        <div className="space-y-2 pt-4 border-t border-black/10">
          {BOTTOM_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="p-3 rounded-lg flex gap-3 items-center text-base text-muted-foreground hover:text-foreground transition-colors"
            >
              {({ isActive }) => (
                <span
                  className={`flex gap-3 items-center w-full rounded-lg p-3 -m-3 transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-primary/10"
                  }`}
                >
                  <item.icon
                    size={22}
                    weight={isActive ? "Bold" : "Outline"}
                  />
                  <span className={isActive ? "font-semibold" : ""}>
                    {item.label}
                  </span>
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
