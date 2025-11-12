import { pgEnum } from "drizzle-orm/pg-core";

// Overall status for the entire video job
export const videoStatusEnum = pgEnum("video_status", [
  "PENDING",
  "GENERATING",
  "COMPLETED",
  "FAILED",
]);

// Status for each individual background task
export const taskStatusEnum = pgEnum("task_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
]);

// The specific type of task from your 6-step list
export const taskTypeEnum = pgEnum("task_type", [
  "GENERATE_SCRIPT",
  "GENERATE_SCENES",
  "GENERATE_VOICEOVER",
  "GENERATE_IMAGES",
  "GENERATE_CAPTIONS",
  "STITCH_VIDEO",
]);