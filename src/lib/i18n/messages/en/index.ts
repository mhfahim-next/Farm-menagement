import { account } from "./account";
import { auth } from "./auth";
import { common } from "./common";
import { dairy } from "./dairy";
import { farm } from "./farm";
import { landing } from "./landing";

export const en = { ...common, ...auth, ...landing, ...farm, ...dairy, ...account } as const;
export type EnMessages = typeof en;
