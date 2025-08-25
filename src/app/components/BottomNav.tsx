"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Calendar, BarChart3, TrendingDown, Settings } from "lucide-react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Calendar, label: "Log" },
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/taper", icon: TrendingDown, label: "Taper" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface BottomNavProps {
  onAddClick?: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/50 pb-2 z-50 w-full bottom-nav animate-slide-in-bottom">
      <div className="flex items-center justify-between py-3 px-4 max-w-md mx-auto w-full">
        {/* First two nav items */}
        {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 h-auto py-3 px-1 min-h-[60px] w-full text-sm transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                pathname === href
                  ? "text-emerald-600 bg-emerald-600/10 rounded-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon
                className={cn(
                  "h-7 w-7 transition-transform duration-200",
                  pathname === href && "scale-110"
                )}
              />
              <span className="font-medium text-xs leading-tight">{label}</span>
            </Button>
          </Link>
        ))}

        {/* Enhanced Center Add Button */}
        <Button
          onClick={onAddClick}
          className="rounded-full w-16 h-16 bg-emerald-600 hover:bg-emerald-700 shadow-2xl -mt-8 flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-emerald-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          size="icon"
          aria-label="Add new entry"
        >
          <div className="w-10 h-10 mask-weed bg-white transition-transform duration-200 group-hover:scale-110"></div>
        </Button>

        {/* Last two nav items */}
        {navItems.slice(2).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 h-auto py-3 px-1 min-h-[60px] w-full text-sm transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                pathname === href
                  ? "text-emerald-600 bg-emerald-600/10 rounded-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon
                className={cn(
                  "h-7 w-7 transition-transform duration-200",
                  pathname === href && "scale-110"
                )}
              />
              <span className="font-medium text-xs leading-tight">{label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
