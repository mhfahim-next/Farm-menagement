"use server";

import { revalidatePath } from "next/cache";
import { str } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const RULES: Record<string, "contact.err.required" | "contact.err.reply" | "contact.err.busy"> = {
  "Enter your name and a message.": "contact.err.required",
  "Give an email or a phone number so we can reply.": "contact.err.reply",
  "Too many messages right now. Please try again later.": "contact.err.busy",
};

export async function sendContactMessage(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  // Bots fill every field; people never see this one.
  if (str(formData, "website")) return { success: t("contact.sent") };

  const name = str(formData, "name");
  const message = str(formData, "message");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  if (!name || !message || message.length < 5) return { error: t("contact.err.required") };
  if (!email && !phone) return { error: t("contact.err.reply") };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: t("contact.err.email") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_subject: str(formData, "subject"),
    p_message: message,
  });
  if (error) return { error: RULES[error.message] ? t(RULES[error.message]) : t("common.errorGeneric") };
  revalidatePath("/admin/messages");
  return { success: t("contact.sent") };
}
