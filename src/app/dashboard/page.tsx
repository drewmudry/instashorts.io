import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardNav } from "@/components/dashboard-nav";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />

      {/* Dashboard Content */}
      <main className="flex-1 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
            Welcome to Your Dashboard
          </h1>
          
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link href="/videos">
              <div className="rounded-lg border bg-zinc-50 p-8 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <h2 className="mb-2 text-2xl font-semibold">Videos</h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  View and manage your standalone videos
                </p>
              </div>
            </Link>

            <Link href="/series">
              <div className="rounded-lg border bg-zinc-50 p-8 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                <h2 className="mb-2 text-2xl font-semibold">Series</h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  View and manage your video series
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
