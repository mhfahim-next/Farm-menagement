/** Why someone asks to delete their account (optional; admins see it in /admin/deletions). */
export const DELETE_REASONS = ["too_expensive", "hard_to_use", "other_app", "not_needed", "privacy", "other"] as const;
export type DeleteReason = (typeof DELETE_REASONS)[number];
