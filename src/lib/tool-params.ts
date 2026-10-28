import "server-only";
import { cache } from "react";
import { getCachedToolRows } from "@/lib/public-data";
import { mergeToolParams, TOOL_DEFAULTS } from "@/lib/tools";

/**
 * The numbers the farm tools calculate with: the defaults, with any changes a
 * super admin saved laid over them. Cached across requests; if the database
 * can't be reached the tools still work with their defaults.
 */
export const getToolParams = cache(async () => {
  try {
    return mergeToolParams(await getCachedToolRows());
  } catch (e) {
    console.error("Could not load tool settings:", e instanceof Error ? e.message : e);
    return { params: TOOL_DEFAULTS, custom: {} };
  }
});
