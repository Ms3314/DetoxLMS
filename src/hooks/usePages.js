import { useLocalStorage } from "./useLocalStorage";
import { newId } from "../lib/workspace";

// Shared by the Sami Labs section and the notepad beside the video, so both
// read and write the same pages.
export const PAGES_KEY = "ytch-thoughts-pages-v1";
// The single-page key from before multi-page support; migrated on first load.
const LEGACY_PAGE_KEY = "ytch-thoughts-page-v1";

export function makePage(seed = {}) {
  return { id: newId(), title: "", body: "", ts: Date.now(), ...seed };
}

function initialPages() {
  try {
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_PAGE_KEY) ?? "null");
    if (legacy && (legacy.title || legacy.body)) {
      return [makePage({ title: legacy.title ?? "", body: legacy.body ?? "" })];
    }
  } catch {
    /* ignore unreadable legacy data */
  }
  return [makePage()];
}

export function usePages() {
  return useLocalStorage(PAGES_KEY, initialPages);
}
