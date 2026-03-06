"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_EMAILS } from "@/lib/constants";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Users, Newspaper } from "lucide-react";
import type { Profile } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<(Profile & { briefing_count?: number; last_briefing?: string })[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [triggeringFor, setTriggeringFor] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
        return;
      }
      const isAdmin = profile?.is_admin || ADMIN_EMAILS.includes(user.email || "");
      if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers((data as Profile[]) || []);
      setLoadingUsers(false);
    };
    if (user) fetchUsers();
  }, [user]);

  const triggerBriefing = async (userId: string) => {
    setTriggeringFor(userId);
    try {
      await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      // ignore
    }
    setTriggeringFor(null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">Total users</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Newspaper className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.onboarded).length}</div>
                <div className="text-sm text-muted-foreground">Onboarded users</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Topics</th>
                      <th className="pb-3 font-medium">Send Time</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="py-3">{u.email}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.topics || []).slice(0, 3).map(t => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                            {(u.topics || []).length > 3 && (
                              <Badge variant="outline" className="text-xs">+{u.topics.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3">{u.send_time}</td>
                        <td className="py-3">
                          <Badge variant={u.onboarded ? "default" : "secondary"}>
                            {u.onboarded ? "Active" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerBriefing(u.id)}
                            disabled={triggeringFor === u.id || !u.onboarded}
                          >
                            {triggeringFor === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            <span className="ml-1">Generate</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
