import type { EnMessages } from "../en";
import { account } from "./account";
import { auth } from "./auth";
import { common } from "./common";
import { dairy } from "./dairy";
import { farm } from "./farm";
import { landing } from "./landing";

// Typed against the English keys: a missing Bangla string is a compile error.
export const bn: Record<keyof EnMessages, string> = {
  ...common,
  ...auth,
  ...landing,
  ...farm,
  ...dairy,
  ...account,
};
