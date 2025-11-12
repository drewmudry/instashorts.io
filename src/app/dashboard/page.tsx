"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // This is your route protection
  useEffect(() => {
    if (!isPending && !session?.user) {
      // Redirect to sign-in page if not authenticated
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Only render the dashboard if the user is logged in
  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-black/80">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="text-xl font-semibold">InstaShorts</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {session.user.email}
              </span>
              <Button
                variant="outline"
                onClick={() => authClient.signOut()} // Sign out logic
              >
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
              Welcome to Your Dashboard
            </h1>
            <div className="rounded-lg border bg-zinc-50 p-8 dark:bg-zinc-900">
              <p className="text-lg text-zinc-700 dark:text-zinc-300">
                You're signed in as{" "}
                <span className="font-semibold">{session.user.email}</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // This will show briefly before the redirect happens
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}