import { account } from "./account";
import { adminplans } from "./adminplans";
import { auth } from "./auth";
import { blog } from "./blog";
import { common } from "./common";
import { dairy } from "./dairy";
import { farm } from "./farm";
import { landing } from "./landing";
import { plans } from "./plans";
import { team } from "./team";

export const en = { ...common, ...auth, ...landing, ...farm, ...dairy, ...account, ...plans, ...team, ...adminplans, ...blog } as const;
export type EnMessages = typeof en;
