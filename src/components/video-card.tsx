"use client";

import { video } from "@/db/schema";
import { Play, Clock, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Video = typeof video.$inferSelect;

interface VideoCardProps {
  video: Video;
  size?: "default" | "compact";
}

export function VideoCard({ video, size = "default" }: VideoCardProps) {
  const isCompact = size === "compact";
  
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

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${
      isCompact ? "h-32" : "h-auto"
    }`}>
      <CardContent className={`p-0 ${isCompact ? "flex h-full" : ""}`}>
        {/* Video Preview */}
        <div className={`relative ${
          isCompact 
            ? "w-20 flex-shrink-0" 
            : "aspect-[9/16] w-full max-w-[200px] mx-auto"
        } bg-gray-900 rounded-t-lg overflow-hidden ${
          isCompact ? "rounded-l-lg rounded-tr-none" : ""
        }`}>
          {video.videoUrl && video.status === "COMPLETED" ? (
            <video
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              onMouseEnter={(e) => {
                const videoEl = e.target as HTMLVideoElement;
                videoEl.play();
              }}
              onMouseLeave={(e) => {
                const videoEl = e.target as HTMLVideoElement;
                videoEl.pause();
                videoEl.currentTime = 0;
              }}
            >
              <source src={`${video.videoUrl}#t=1`} type="video/mp4" />
            </video>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              {video.status !== "PENDING" && video.status !== "COMPLETED" && video.status !== "FAILED" ? (
                <div className="animate-pulse">
                  <div className="w-8 h-8 bg-gray-600 rounded"></div>
                </div>
              ) : (
                <Play className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
              {formatStatus(video.status)}
            </span>
          </div>

          {/* Duration Badge (if available) */}
          {video.videoUrl && (
            <div className="absolute bottom-2 right-2">
              <span className="px-2 py-1 bg-black/70 text-white rounded text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {/* You might want to add duration to your schema */}
                0:30
              </span>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className={`${isCompact ? "flex-1 p-3" : "p-4"}`}>
          <div className={`${isCompact ? "space-y-1" : "space-y-3"}`}>
            <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${
              isCompact ? "text-sm line-clamp-1" : "text-base line-clamp-2"
            }`}>
              {video.title || video.theme}
            </h3>
            
            {!isCompact && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {video.script ? 
                  video.script.substring(0, 100) + (video.script.length > 100 ? "..." : "") :
                  `Video about ${video.theme}`
                }
              </p>
            )}

            <div className={`flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${
              isCompact ? "text-xs" : "text-sm"
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(video.createdAt)}</span>
            </div>

            {/* Action Buttons */}
            {video.videoUrl && video.status === "COMPLETED" && (
              <div className={`flex gap-2 ${isCompact ? "hidden group-hover:flex" : ""}`}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(video.videoUrl!, "_blank")}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}