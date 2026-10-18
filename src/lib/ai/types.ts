/** What the assistant wants to write, shown to the farmer for confirmation. */
export type ProposalKind = "milk" | "health" | "breeding" | "animal" | "flock_log" | "transaction" | "weight";

export const PROPOSAL_KINDS: ProposalKind[] = ["milk", "health", "breeding", "animal", "flock_log", "transaction", "weight"];

export type Proposal = {
  id: string;
  kind: ProposalKind;
  /** One-line summary, already in the user's language. */
  title: string;
  /** Detail lines for the confirmation card. */
  lines: string[];
  /** Form fields to submit to the same server action the normal form uses. */
  fields: [string, string][];
};

export type ChatTurn = { role: "user" | "assistant"; text: string };

export type AskResult = {
  error?: string;
  /** The assistant's reply (may be empty when only proposals were produced). */
  reply?: string;
  proposals?: Proposal[];
  /** Prompts used / allowed this month after this request (max null = unlimited). */
  status?: { used: number; max: number | null };
  /** True when the monthly limit blocked the request. */
  limitReached?: boolean;
};
