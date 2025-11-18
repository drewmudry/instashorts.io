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
import { getVideosInSeries, createSeries, toggleSeriesActive } from "@/actions/series";
import { series, video } from "@/db/schema";
import { Plus, Pause, Play } from "lucide-react";
import { ArtStyleSelector } from "@/components/art-style-selector";

type Series = typeof series.$inferSelect;
type Video = typeof video.$inferSelect;

interface SeriesClientProps {
  initialSeries: Series[];
}

export function SeriesClient({ initialSeries }: SeriesClientProps) {
  const [seriesList, setSeriesList] = useState<Series[]>(initialSeries);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [seriesVideos, setSeriesVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>("");
  const [captionColor, setCaptionColor] = useState<string>("#FFD700");
  const [isCustomColor, setIsCustomColor] = useState<boolean>(false);
  const [captionPosition, setCaptionPosition] = useState<string>("bottom");
  const [emojiCaptions, setEmojiCaptions] = useState<boolean>(false);

  // Preset colors for caption highlights (same as videos-client)
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

  const loadSeries = async () => {
    try {
      const { getSeries } = await import("@/actions/series");
      const updatedSeries = await getSeries();
      setSeriesList(updatedSeries as Series[]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateSeries = async (formData: FormData) => {
    startTransition(async () => {
      // Add emoji captions to form data
      if (emojiCaptions) {
        formData.set("emojiCaptions", "true");
      }
      
      const result = await createSeries(formData);
      if (result?.error) {
        alert(result.error);
      } else {
        formRef.current?.reset();
        setSelectedArtStyle("");
        setCaptionColor("#FFD700");
        setIsCustomColor(false);
        setCaptionPosition("bottom");
        setEmojiCaptions(false);
        setIsCreateOpen(false);
        await loadSeries();
      }
    });
  };

  const handleToggleActive = async (seriesId: string) => {
    setIsToggling(seriesId);
    try {
      const result = await toggleSeriesActive(seriesId);
      if (result?.error) {
        alert(result.error);
      } else {
        await loadSeries();
      }
    } catch (error) {
      console.error("Failed to toggle series:", error);
      alert("Failed to toggle series");
    } finally {
      setIsToggling(null);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "GENERATING_VOICEOVER":
        return "Generating Voice Over";
      case "GENERATING_SCENES":
        return "Generating Scenes";
      case "GENERATING_IMAGES":
        return "Generating Images";
      case "QUEUED_FOR_RENDERING":
        return "Queued for Rendering";
      case "RENDERING":
        return "Rendering";
      case "UPLOADING_FINAL_VIDEO":
        return "Uploading Final Video";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "GENERATING_VOICEOVER":
      case "GENERATING_SCENES":
      case "GENERATING_IMAGES":
      case "QUEUED_FOR_RENDERING":
      case "RENDERING":
      case "UPLOADING_FINAL_VIDEO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Series</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Series
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Series</DialogTitle>
                <DialogDescription>
                  Create an autopilot series that will automatically generate videos on a schedule
                </DialogDescription>
              </DialogHeader>
              <form
                ref={formRef}
                action={handleCreateSeries}
                className="space-y-6"
              >
                <div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    The main theme for this series. Each video will explore a specific sub-topic within this theme.
                  </p>
                  <input
                    id="theme"
                    type="text"
                    name="theme"
                    placeholder="e.g., Ancient Rome, Psychology Facts, Space Exploration"
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
                              const normalizedValue = value.toUpperCase();
                              if (presetColors.some(preset => preset.toUpperCase() === normalizedValue)) {
                                setIsCustomColor(false);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.toUpperCase();
                            if (value && !/^#[0-9A-F]{6}$/.test(value)) {
                              setCaptionColor("#FFD700");
                              setIsCustomColor(false);
                            } else if (value && presetColors.some(preset => preset.toUpperCase() === value)) {
                              setCaptionColor(value);
                              setIsCustomColor(false);
                            } else if (value) {
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
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !selectedArtStyle}>
                    {isSubmitting ? "Creating..." : "Create Series"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border bg-zinc-50 p-8 dark:bg-zinc-900">
          {seriesList.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">
              <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">No series yet</h3>
              <p className="text-sm mb-4">Create your first autopilot series to get started</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Series
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {seriesList.map((seriesItem) => (
                <div
                  key={seriesItem.id}
                  className="rounded-md border bg-white p-4 transition-colors dark:bg-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleSeriesClick(seriesItem)}
                    >
                      <div className="flex items-center gap-3">
                        {seriesItem.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                            Paused
                          </span>
                        )}
                      </div>
                      {seriesItem.theme && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          Theme: {seriesItem.theme}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(seriesItem.id)}
                      disabled={isToggling === seriesItem.id}
                    >
                      {isToggling === seriesItem.id ? (
                        "Loading..."
                      ) : seriesItem.isActive ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
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
                    <span className={`ml-4 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(video.status)}`}>
                      {formatStatus(video.status)}
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

