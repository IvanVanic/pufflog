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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md pb-2 z-50 w-full">
      <div className="flex items-center justify-between py-2 px-4 max-w-md mx-auto w-full">
        {/* First two nav items */}
        {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 h-auto py-3 px-1 min-h-[56px] w-full text-sm",
                pathname === href && "text-emerald-600"
              )}
            >
              <Icon className="h-7 w-7" />
              <span className="font-medium text-xs leading-tight">{label}</span>
            </Button>
          </Link>
        ))}

        {/* Center Add Button */}
        <Button
          onClick={onAddClick}
          className="rounded-full w-16 h-16 bg-background/80 backdrop-blur-md border-2 border-emerald-600 hover:bg-background/90 shadow-xl -mt-6 flex-shrink-0"
          size="icon"
          aria-label="Add entry"
        >
          <div className="w-10 h-10 mask-weed bg-emerald-600"></div>
        </Button>

        {/* Last two nav items */}
        {navItems.slice(2).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 h-auto py-3 px-1 min-h-[56px] w-full text-sm",
                pathname === href && "text-emerald-600"
              )}
            >
              <Icon className="h-7 w-7" />
              <span className="font-medium text-xs leading-tight">{label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
