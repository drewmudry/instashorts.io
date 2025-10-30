'use server';

// Types based on the Higgsfield API schema

export interface SoulStyle {
  id: string;
  name: string;
  description?: string | null;
  preview_url: string;
}

export interface WebhookPayload {
  url: string;
  secret: string;
}

export interface ImageUrlInputImageSchema {
  type: 'image_url';
  image_url: string;
}

export interface Text2ImageSoulParams {
  prompt: string;
  width_and_height:
    | '1152x2048'
    | '2048x1152'
    | '2048x1536'
    | '1536x2048'
    | '1344x2016'
    | '2016x1344'
    | '960x1696'
    | '1536x1536'
    | '1536x1152'
    | '1696x960'
    | '1152x1536'
    | '1088x1632'
    | '1632x1088';
  enhance_prompt?: boolean;
  style_id?: string;
  style_strength?: number;
  quality?: '720p' | '1080p';
  seed?: number | null;
  custom_reference_id?: string | null;
  custom_reference_strength?: number;
  image_reference?: ImageUrlInputImageSchema | null;
  batch_size?: 1 | 4;
}

export interface CreateText2ImageSoulJobSchema {
  webhook?: WebhookPayload | null;
  params: Text2ImageSoulParams;
}

export type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw';
export type JobSetType = 'text2image_soul' | 'image2video';

export interface JobResult {
  min?: {
    type: string;
    url: string;
  };
  raw?: {
    type: string;
    url: string;
  };
}

export interface Job {
  id: string;
  job_set_type: JobSetType;
  status: JobStatus;
  results: JobResult | null;
}

export interface JobSet {
  id: string;
  type: JobSetType;
  created_at: string;
  jobs: Job[];
  input_params: Record<string, unknown>;
}

// Helper function to get API credentials from environment
function getApiCredentials() {
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const apiSecret = process.env.HIGGSFIELD_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Missing Higgsfield API credentials. Please set HIGGSFIELD_API_KEY and HIGGSFIELD_API_SECRET environment variables.'
    );
  }

  return { apiKey, apiSecret };
}

/**
 * Get available Soul styles from Higgsfield API
 * @returns Array of available soul styles
 */
export async function getSoulStyles(): Promise<SoulStyle[]> {
  try {
    const { apiKey, apiSecret } = getApiCredentials();

    const response = await fetch('https://platform.higgsfield.ai/v1/text2image/soul-styles', {
      method: 'GET',
      headers: {
        'hf-api-key': apiKey,
        'hf-secret': apiSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch soul styles: ${response.status} - ${errorText}`);
    }

    const data: SoulStyle[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching soul styles:', error);
    throw error;
  }
}

/**
 * Generate an image using the Higgsfield Soul model
 * @param params - Text2Image generation parameters
 * @returns JobSet containing the generation job information
 */
export async function generateSoulImage(
  params: Text2ImageSoulParams,
  webhook?: WebhookPayload | null
): Promise<JobSet> {
  try {
    const { apiKey, apiSecret } = getApiCredentials();

    const requestBody: CreateText2ImageSoulJobSchema = {
      params,
      ...(webhook && { webhook }),
    };

    const response = await fetch('https://platform.higgsfield.ai/v1/text2image/soul', {
      method: 'POST',
      headers: {
        'hf-api-key': apiKey,
        'hf-secret': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate soul image: ${response.status} - ${errorText}`);
    }

    const data: JobSet = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating soul image:', error);
    throw error;
  }
}

/**
 * Check the status of a job set by polling the API
 * @param jobSetId - The job set ID to check
 */
export async function getJobSetStatus(jobSetId: string): Promise<JobSet> {
  try {
    const { apiKey, apiSecret } = getApiCredentials();

    const response = await fetch(`https://platform.higgsfield.ai/v1/job-sets/${jobSetId}`, {
      method: 'GET',
      headers: {
        'hf-api-key': apiKey,
        'hf-secret': apiSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch job set status: ${response.status} - ${errorText}`);
    }

    const data: JobSet = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching job set status:', error);
    throw error;
  }
}

/**
 * Poll a job set until all jobs are completed or failed
 * Useful for local development when webhooks aren't available
 * @param jobSetId - The job set ID to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Time between polls in milliseconds (default: 2000)
 * @returns The completed job set
 */
export async function pollJobSetUntilComplete(
  jobSetId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<JobSet> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const jobSet = await getJobSetStatus(jobSetId);

      // Check all jobs in the job set
      const allCompleted = jobSet.jobs.every((job) => job.status === 'completed');
      const anyFailed = jobSet.jobs.some((job) => job.status === 'failed' || job.status === 'nsfw');

      if (allCompleted) {
        console.log(`Job set ${jobSetId} completed successfully`);
        return jobSet;
      }

      if (anyFailed) {
        const failedJob = jobSet.jobs.find((job) => job.status === 'failed' || job.status === 'nsfw');
        throw new Error(`Job set ${jobSetId} has failed job with status: ${failedJob?.status}`);
      }

      // Jobs are still processing (queued or in_progress)
      const statusSummary = jobSet.jobs.map((job) => job.status).join(', ');
      console.log(`Job set ${jobSetId} status: [${statusSummary}]. Polling again in ${intervalMs}ms...`);
      
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    } catch (error) {
      if (attempts >= maxAttempts - 1) {
        throw error;
      }
      console.error(`Error polling job set status (attempt ${attempts + 1}):`, error);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    }
  }

  throw new Error(`Job set ${jobSetId} did not complete within ${maxAttempts} attempts`);
}

/**
 * Generate an image and wait for it to complete (for local development)
 * Combines generateSoulImage and polling
 * @param params - Text2Image generation parameters
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Time between polls in milliseconds (default: 2000)
 * @returns The first completed job with results and the enhanced prompt if applicable
 */
export async function generateSoulImageAndWait(
  params: Text2ImageSoulParams,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<{ job: Job; enhancedPrompt?: string }> {
  // Generate the image (no webhook needed for local dev)
  const jobSet = await generateSoulImage(params);

  console.log(`Image generation started. Job Set ID: ${jobSet.id}`);

  // Poll until complete
  const completedJobSet = await pollJobSetUntilComplete(jobSet.id, maxAttempts, intervalMs);

  // Return the first job (or if batch_size > 1, you might want to handle multiple jobs)
  const completedJob = completedJobSet.jobs[0];
  if (!completedJob) {
    throw new Error('No job returned from completed job set');
  }

  // Extract enhanced prompt from input_params if it was enhanced
  const enhancedPrompt = (completedJobSet.input_params?.prompt as string) || undefined;

  return { 
    job: completedJob,
    enhancedPrompt: params.enhance_prompt ? enhancedPrompt : undefined
  };
}

/**
 * Generate images and wait for all to complete (for batch generation)
 * Returns all jobs in the completed job set
 * @param params - Text2Image generation parameters
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Time between polls in milliseconds (default: 2000)
 * @returns All completed jobs with results
 */
export async function generateSoulImageBatchAndWait(
  params: Text2ImageSoulParams,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<Job[]> {
  // Generate the images (no webhook needed for local dev)
  const jobSet = await generateSoulImage(params);

  console.log(`Batch image generation started. Job Set ID: ${jobSet.id}, Jobs: ${jobSet.jobs.length}`);

  // Poll until complete
  const completedJobSet = await pollJobSetUntilComplete(jobSet.id, maxAttempts, intervalMs);

  return completedJobSet.jobs;
}

