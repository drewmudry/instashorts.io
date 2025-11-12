"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getVideosInSeries } from "@/app/actions/videos";
import { series, video } from "@/db/schema";

type Series = typeof series.$inferSelect;
type Video = typeof video.$inferSelect;

interface SeriesClientProps {
  initialSeries: Series[];
}

export function SeriesClient({ initialSeries }: SeriesClientProps) {
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [seriesVideos, setSeriesVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSeriesClick = async (seriesItem: Series) => {
    setSelectedSeries(seriesItem);
    setIsOpen(true);
    setIsLoading(true);

    try {
      const videos = await getVideosInSeries(seriesItem.id);
      setSeriesVideos(videos as Video[]);
    } catch (error) {
      console.error("Failed to load videos:", error);
      setSeriesVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold">Your Series</h2>

        <div className="rounded-lg border bg-zinc-50 p-8 dark:bg-zinc-900">
          {initialSeries.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              You haven't created any series yet.
            </p>
          ) : (
            <div className="space-y-4">
              {initialSeries.map((seriesItem) => (
                <div
                  key={seriesItem.id}
                  onClick={() => handleSeriesClick(seriesItem)}
                  className="cursor-pointer rounded-md border bg-white p-4 transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {seriesItem.name}
                      </h3>
                      {seriesItem.theme && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          Theme: {seriesItem.theme}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSeries?.name || "Series Videos"}
            </DialogTitle>
            <DialogDescription>
              Videos in this series
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">
                Loading videos...
              </div>
            ) : seriesVideos.length === 0 ? (
              <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">
                No videos in this series yet.
              </div>
            ) : (
              <div className="space-y-3">
                {seriesVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between rounded-md border bg-zinc-50 p-4 dark:bg-zinc-800"
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
        </DialogContent>
      </Dialog>
    </>
  );
}

