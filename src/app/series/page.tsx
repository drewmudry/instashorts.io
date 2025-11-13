import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { getSeries } from "@/actions/series";
import { SeriesClient } from "./series-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SeriesPage() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user) {
    redirect("/sign-in");
  }

  const series = await getSeries();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <SeriesClient initialSeries={series} />
          </div>
        </main>
      </div>
    </div>
  );
}

