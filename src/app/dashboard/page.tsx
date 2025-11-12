import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl">
            {/* Welcome Section */}
            <div className="mb-8 rounded-lg border bg-card p-8">
              <h1 className="mb-2 text-3xl font-bold">Welcome to InstaShorts</h1>
              <p className="mb-6 text-muted-foreground">
                Create faceless videos using AI, in seconds.
              </p>
              <Button size="lg" asChild>
                <Link href="/videos">
                  <Film className="mr-2 h-5 w-5" />
                  Create New Video
                </Link>
              </Button>
            </div>

            {/* Recent Videos Section */}
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Film className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Recent videos</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Recently created videos
              </p>
              <div className="mt-4 min-h-[200px] rounded-lg border-2 border-dashed p-8 text-center">
                <p className="text-muted-foreground">No videos yet</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
