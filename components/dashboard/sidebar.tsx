"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Newspaper, Archive, Settings, Shield, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", icon: Newspaper },
  { href: "/dashboard/archive", label: "Archive", icon: Archive },
  { href: "/dashboard/preferences", label: "Preferences", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-tight">Morning Brief</h1>
      </div>

      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {profile?.is_admin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === "/admin"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>

      <Separator className="my-4" />

      <div className="space-y-3 text-sm text-muted-foreground">
        <div>
          <div className="font-medium text-foreground">{profile?.email}</div>
        </div>
        <div>Member since {memberSince}</div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 justify-start text-muted-foreground"
        onClick={signOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </aside>
  );
}
