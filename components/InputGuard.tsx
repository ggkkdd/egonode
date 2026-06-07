"use client";

import { useEffect } from "react";

/**
 * Keeps the game fair by restricting copy/paste:
 *  - blocks COPYING/CUTTING text from the page (so the scenario can't be lifted
 *    out and fed to an AI), and
 *  - blocks PASTING or drag-dropping prepared text into the inputs (so plans
 *    must actually be typed).
 *
 * Listens at the document level so it covers every input and the whole page,
 * and because keyboard shortcuts (Ctrl/Cmd+C/V/X, Shift/Ctrl+Insert) and
 * right-click all fire these same cancelable events. CSS in globals.css also
 * disables text selection; this stops the clipboard and drag paths. Mounted
 * once in the root layout.
 */
export default function InputGuard() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const events = [
      "copy",
      "cut",
      "paste",
      "contextmenu",
      "dragstart",
      "drop",
    ] as const;
    events.forEach((type) => document.addEventListener(type, block));
    return () =>
      events.forEach((type) => document.removeEventListener(type, block));
  }, []);

  return null;
}
