import { ai } from "./ai";
import { account } from "./account";
import { adminplans } from "./adminplans";
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
import { team } from "./team";
import { trade } from "./trade";

export const en = { ...common, ...auth, ...landing, ...farm, ...dairy, ...account, ...plans, ...team, ...adminplans, ...blog, ...ai, ...farmops, ...community, ...trade, ...changelog } as const;
export type EnMessages = typeof en;
