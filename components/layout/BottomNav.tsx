"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Package, User, UtensilsCrossed } from "lucide-react";

const items = [
  { href: "/swipe", label: "Swipe", icon: UtensilsCrossed },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/fridge", label: "Fridge", icon: Package },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface px-6 pb-[env(safe-area-inset-bottom)] pt-3">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[60px] flex-col items-center gap-1 text-xs ${
                active ? "text-accent" : "text-text-tertiary"
              }`}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
