import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Film, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getRecentVideos } from "@/actions/videos";
import { video } from "@/db/schema";
import { VideoCard } from "@/components/video-card";

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
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Recent videos</h2>
                </div>
                {recentVideos.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/videos">
                      View all
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Your latest created videos
              </p>
              
              {recentVideos.length === 0 ? (
                <div className="min-h-[200px] rounded-lg border-2 border-dashed p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No videos yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get started by creating your first AI-generated video
                    </p>
                    <Button asChild>
                      <Link href="/videos">
                        Create your first video
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
