import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";
import Link from "next/link";
import { getRecentVideos } from "@/actions/videos";
import { video } from "@/db/schema";

type Video = typeof video.$inferSelect;

export default async function DashboardPage() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user) {
    redirect("/sign-in");
  }

  const recentVideos = (await getRecentVideos()) as Video[];

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
              <div className="mt-4 min-h-[200px] rounded-lg border-2 border-dashed p-8">
                {recentVideos.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No videos yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {recentVideos.map((video) => (
                      <div
                        key={video.id}
                        className="flex flex-col rounded-md border bg-white dark:bg-zinc-800 overflow-hidden"
                      >
                        <div className="aspect-[9/16] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                          {video.videoUrl ? (
                            <video
                              src={video.videoUrl}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Film className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {video.status}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {video.theme}
                          </p>
                          <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {video.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
