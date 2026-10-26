import type { EnMessages } from "../en";
import { ai } from "./ai";
import { account } from "./account";
import { adminplans } from "./adminplans";
import { analyticsplus } from "./analyticsplus";
import { auth } from "./auth";
import { blog } from "./blog";
import { changelog } from "./changelog";
import { common } from "./common";
import { community } from "./community";
import { dairy } from "./dairy";
import { farm } from "./farm";
import { farmops } from "./farmops";
import { landing } from "./landing";
import { plans } from "./plans";
import { printing } from "./printing";
import { team } from "./team";
import { importing } from "./importing";
import { offline } from "./offline";
import { trade } from "./trade";
import { payments } from "./payments";
import { livestock } from "./livestock";
import { reminders } from "./reminders";

// Typed against the English keys: a missing Bangla string is a compile error.
export const bn: Record<keyof EnMessages, string> = {
  ...common,
  ...auth,
  ...landing,
  ...farm,
  ...dairy,
  ...account,
  ...plans,
  ...team,
  ...adminplans, ...blog, ...ai, ...farmops, ...community, ...trade, ...changelog, ...offline, ...importing, ...printing, ...analyticsplus, ...payments, ...livestock, ...reminders,
};
