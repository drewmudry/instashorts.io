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
import { Plus, Grid, List } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { ArtStyleSelector } from "@/components/art-style-selector";

type Video = typeof video.$inferSelect;

interface VideosClientProps {
  initialVideos: Video[];
}

export function VideosClient({ initialVideos }: VideosClientProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>("");
  const [captionColor, setCaptionColor] = useState<string>("#FFD700");
  const [isCustomColor, setIsCustomColor] = useState<boolean>(false);
  const [captionPosition, setCaptionPosition] = useState<string>("bottom");
  const [emojiCaptions, setEmojiCaptions] = useState<boolean>(false);

  // Preset colors for caption highlights
  const presetColors = [
    "#FFD700", // Gold (default)
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B739", // Orange
    "#52BE80", // Green
    "#EC7063", // Coral
  ];

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
      // Add emoji captions to form data
      if (emojiCaptions) {
        formData.set("emojiCaptions", "true");
      }
      
      const result = await createVideo(formData);
      if (result?.error) {
        alert(result.error);
      } else {
        formRef.current?.reset();
        setSelectedArtStyle("");
        setCaptionColor("#FFD700");
        setIsCustomColor(false);
        setCaptionPosition("bottom");
        setEmojiCaptions(false);
        setIsOpen(false);
        await loadVideos();
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Videos</h2>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Video</DialogTitle>
              <DialogDescription>
                Enter a theme and customize your video settings.
              </DialogDescription>
            </DialogHeader>
            <form
              ref={formRef}
              action={handleCreateVideo}
              className="space-y-6"
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

              <div>
                <ArtStyleSelector
                  value={selectedArtStyle}
                  onChange={setSelectedArtStyle}
                />
                <input
                  type="hidden"
                  name="artStyle"
                  value={selectedArtStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Caption Highlight Color
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Choose the color that highlights the word being spoken
                </p>
                
                {/* Preset Color Boxes */}
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {presetColors.map((color) => {
                    const isSelected = !isCustomColor && captionColor.toUpperCase() === color.toUpperCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setCaptionColor(color);
                          setIsCustomColor(false);
                        }}
                        className={`
                          h-12 w-full rounded-lg border-2 transition-all
                          hover:scale-105 hover:shadow-md
                          ${isSelected 
                            ? "border-yellow-500 dark:border-yellow-500 ring-2 ring-yellow-500/20 shadow-sm" 
                            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                          }
                        `}
                        style={{ backgroundColor: color }}
                        disabled={isSubmitting}
                        title={color}
                      >
                        {isSelected && (
                          <div className="flex items-center justify-center h-full">
                            <svg
                              className="h-5 w-5 text-white drop-shadow-lg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Option */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="customColor"
                      checked={isCustomColor}
                      onChange={(e) => {
                        setIsCustomColor(e.target.checked);
                        if (!e.target.checked && !presetColors.includes(captionColor)) {
                          setCaptionColor("#FFD700");
                        }
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-500"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="customColor"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Use custom color
                    </label>
                  </div>

                  {isCustomColor && (
                    <div className="flex items-center gap-3">
                      <input
                        id="captionColor"
                        type="color"
                        name="captionHighlightColor"
                        value={captionColor}
                        onChange={(e) => setCaptionColor(e.target.value)}
                        className="h-10 w-20 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <input
                        type="text"
                        value={captionColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                            setCaptionColor(value);
                            // If the typed color matches a preset, uncheck custom color
                            const normalizedValue = value.toUpperCase();
                            if (presetColors.some(preset => preset.toUpperCase() === normalizedValue)) {
                              setIsCustomColor(false);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Validate hex color on blur
                          const value = e.target.value.toUpperCase();
                          if (value && !/^#[0-9A-F]{6}$/.test(value)) {
                            // Invalid color, reset to default
                            setCaptionColor("#FFD700");
                            setIsCustomColor(false);
                          } else if (value && presetColors.some(preset => preset.toUpperCase() === value)) {
                            // Matches a preset, uncheck custom
                            setCaptionColor(value);
                            setIsCustomColor(false);
                          } else if (value) {
                            // Valid custom color, keep it
                            setCaptionColor(value);
                          }
                        }}
                        placeholder="#FFD700"
                        className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 font-mono"
                        disabled={isSubmitting}
                        maxLength={7}
                      />
                    </div>
                  )}
                </div>

                {/* Hidden input for form submission */}
                <input
                  type="hidden"
                  name="captionHighlightColor"
                  value={captionColor}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Caption Position
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Choose where captions appear in the video
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  {(["top", "middle", "bottom"] as const).map((position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => setCaptionPosition(position)}
                      className={`
                        px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                        hover:scale-105 hover:shadow-md
                        ${captionPosition === position
                          ? "border-yellow-500 dark:border-yellow-500 ring-2 ring-yellow-500/20 shadow-sm bg-yellow-50 dark:bg-yellow-900/20"
                          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800"
                        }
                      `}
                      disabled={isSubmitting}
                    >
                      {position.charAt(0).toUpperCase() + position.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Hidden input for form submission */}
                <input
                  type="hidden"
                  name="captionPosition"
                  value={captionPosition}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emojiCaptions"
                    name="emojiCaptions"
                    checked={emojiCaptions}
                    onChange={(e) => setEmojiCaptions(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-yellow-500 focus:ring-yellow-500"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="emojiCaptions"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Add emoji captions
                  </label>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
                  Relevant emojis will appear above key words as they're spoken
                </p>
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
                <Button type="submit" disabled={isSubmitting || !selectedArtStyle}>
                  {isSubmitting ? "Creating..." : "Create Video"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-lg border bg-zinc-50 p-8 dark:bg-zinc-900">
          <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">
            <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">No videos yet</h3>
            <p className="text-sm mb-4">Create your first video to get started</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Video
            </Button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} size="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

