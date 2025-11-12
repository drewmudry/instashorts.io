"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createVideo, getVideosNotInSeries } from "@/actions/videos";
import { video } from "@/db/schema";
import { Plus } from "lucide-react";

type Video = typeof video.$inferSelect;

interface VideosClientProps {
  initialVideos: Video[];
}

export function VideosClient({ initialVideos }: VideosClientProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const loadVideos = async () => {
    try {
      const userVideos = await getVideosNotInSeries();
      setVideos(userVideos as Video[]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateVideo = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createVideo(formData);
      if (result?.error) {
        alert(result.error);
      } else {
        formRef.current?.reset();
        setIsOpen(false);
        await loadVideos();
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Standalone Videos</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Video</DialogTitle>
              <DialogDescription>
                Enter a theme for your new video.
              </DialogDescription>
            </DialogHeader>
            <form
              ref={formRef}
              action={handleCreateVideo}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="theme"
                  className="block text-sm font-medium mb-2"
                >
                  Theme
                </label>
                <input
                  id="theme"
                  type="text"
                  name="theme"
                  placeholder="Enter a theme for your video..."
                  required
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                  disabled={isSubmitting}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Video"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-zinc-50 p-8 dark:bg-zinc-900">
        {videos.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            You haven't created any standalone videos yet.
          </p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between rounded-md border bg-white p-4 dark:bg-zinc-800"
              >
                <p className="truncate text-zinc-700 dark:text-zinc-300">
                  {video.theme}
                </p>
                <span className="ml-4 flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {video.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

