import { saveDailyLog } from "@/app/dashboard/flocks/actions";
import { addMove } from "@/app/dashboard/inventory/actions";
import { saveMilkSession } from "@/app/dashboard/milk/actions";
import { saveAttendance } from "@/app/dashboard/staff/actions";
import type { OutboxKind } from "@/lib/offline/outbox";
import type { ActionState } from "@/lib/types";

/** The server action each kind of offline entry is sent to (the same one the online form uses). */
export const OUTBOX_ACTIONS: Record<OutboxKind, (state: ActionState, formData: FormData) => Promise<ActionState>> = {
  milk: saveMilkSession,
  flock: saveDailyLog,
  stockUse: addMove,
  attendance: saveAttendance,
};
