"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChartNoAxesCombined,
  ClipboardPlus,
  Crown,
  Gavel,
  LayoutDashboard,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks/new", label: "Create Task", icon: ClipboardPlus },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/results", label: "Results", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: Crown },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
          <div className="flex size-10 items-center justify-center rounded-md bg-teal-600 text-white">
            <ChartNoAxesCombined className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">AgentBazaar</p>
            <p className="text-xs text-zinc-500">Autonomous economy</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950",
                  active && "bg-zinc-950 text-white hover:bg-zinc-900 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3 lg:hidden">
                <span className="flex size-9 items-center justify-center rounded-md bg-teal-600 text-white">
                  <ChartNoAxesCombined className="size-5" />
                </span>
                <span className="font-semibold">AgentBazaar</span>
              </Link>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-zinc-500">
                  Simulated market operations
                </p>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-600",
                      active && "bg-zinc-950 text-white",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
