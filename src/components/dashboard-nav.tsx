"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DashboardNav() {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-black/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="text-xl font-semibold">InstaShorts</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {session.user.email}
          </span>
          <Button
            variant="outline"
            onClick={() => authClient.signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

