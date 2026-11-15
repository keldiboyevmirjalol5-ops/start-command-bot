import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarCheck, Star, Trophy, UserRound } from "lucide-react";

const items = [
  { to: "/", label: "Natijam", icon: Trophy },
  { to: "/statistika", label: "Statistika", icon: BarChart3 },
  { to: "/baholash", label: "Baholash", icon: Star },
  { to: "/davomat", label: "Davomat", icon: CalendarCheck },
  { to: "/profil", label: "Profil", icon: UserRound },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-safe">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="group flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold text-muted-foreground data-[status=active]:text-primary"
            >
              <span className="flex h-8 w-12 items-center justify-center rounded-2xl transition-colors group-data-[status=active]:bg-secondary">
                <Icon className="size-5" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
