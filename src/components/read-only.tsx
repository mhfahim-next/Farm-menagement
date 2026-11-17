"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * "View only" members (the viewer role) see every page but no way to change
 * anything: forms, confirm buttons and "add" panels render nothing inside a
 * read-only area. The database refuses their writes anyway; this only keeps
 * buttons they cannot use off the screen.
 */
const ReadOnly = createContext(false);

export function ReadOnlyProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <ReadOnly.Provider value={value}>{children}</ReadOnly.Provider>;
}

/** Personal settings (profile, notifications, leaving a farm) stay usable for everyone. */
export function AllowWrites({ children }: { children: ReactNode }) {
  return <ReadOnly.Provider value={false}>{children}</ReadOnly.Provider>;
}

export const useReadOnly = () => useContext(ReadOnly);
