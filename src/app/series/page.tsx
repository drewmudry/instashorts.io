import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DashboardNav } from "@/components/dashboard-nav";
import { getSeries } from "@/actions/videos";
import { SeriesClient } from "./series-client";

export default async function SeriesPage() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user) {
    redirect("/sign-in");
  }

  const series = await getSeries();

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />

      <main className="flex-1 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
            Series
          </h1>

          <SeriesClient initialSeries={series} />
        </div>
      </main>
    </div>
  );
}

