"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/pvt", label: "PVT", icon: "⏱" },
  { href: "/flanker", label: "Flanker Task", icon: "🎯" },
  { href: "/results", label: "結果履歴", icon: "📊" },
];

export function SidebarNav({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname();

  if (hidden) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-56 border-r border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-1">
      <h1 className="text-lg font-bold mb-4 px-3">CogniSync</h1>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
