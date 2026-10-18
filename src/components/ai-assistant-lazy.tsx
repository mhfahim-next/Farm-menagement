"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { AiAssistant as AiAssistantType } from "./ai-assistant";

// The chat panel is only needed after a tap, so its code loads after the page.
const AiAssistant = dynamic(() => import("./ai-assistant").then((m) => m.AiAssistant), { ssr: false });

export function LazyAiAssistant(props: ComponentProps<typeof AiAssistantType>) {
  return <AiAssistant {...props} />;
}
