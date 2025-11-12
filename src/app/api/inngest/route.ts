import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { allFunctions } from "@/inngest/functions";

// Create an API that serves all your functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allFunctions,
});