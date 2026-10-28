import { useCached } from "@/lib/cache";
import { supabase } from "@/lib/supabase";
import { mergeToolParams, TOOL_DEFAULTS, type ToolParams } from "@/lib/tools";

async function fetchToolRows() {
  const { data, error } = await supabase.from("tool_settings").select("tool, params");
  if (error) throw new Error(error.message);
  return (data ?? []) as { tool: string; params: unknown }[];
}

/**
 * The numbers the tools calculate with: the built-in defaults, with any changes
 * a super admin made on the website. Kept on the phone, so offline the last
 * known numbers (or the defaults) are used.
 */
export function useToolParams(): ToolParams {
  const { data } = useCached("tool-params", fetchToolRows);
  return data ? mergeToolParams(data).params : TOOL_DEFAULTS;
}
