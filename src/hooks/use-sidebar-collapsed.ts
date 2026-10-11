"use client";

import { useSyncExternalStore } from "react";

const KEY = "wadzzo-sidebar-collapsed";
const EVENT = "wadzzo-sidebar-change";

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function set(next: boolean) {
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* private mode: still switches for this page */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Whether the desktop sidebar is collapsed to icons. Saved per browser; expanded on the server and first render. */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  return { collapsed, setCollapsed: set };
}
