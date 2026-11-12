import { useCallback, useEffect, useRef, useState } from "react";

/** How long the exit animation runs before the modal is really unmounted (see .modal-overlay.is-closing). */
const CLOSE_MS = 160;

/** Open modals, topmost last: Escape only closes the topmost one. */
const openModals: symbol[] = [];

/**
 * Closing with an exit animation. Call `close()` instead of `onClose` wherever
 * the user dismisses the modal: `closing` is true for CLOSE_MS (add
 * `is-closing` to the overlay), then `onClose` runs and the parent unmounts it.
 * Escape closes the topmost modal. Set `closeOnEscape: false` for forms where
 * a stray keypress must not throw away what was typed.
 */
export function useModalClose(onClose: () => void, options: { closeOnEscape?: boolean } = {}) {
  const { closeOnEscape = true } = options;
  const [closing, setClosing] = useState(false);
  const isClosing = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const latestOnClose = useRef(onClose);

  useEffect(() => {
    latestOnClose.current = onClose;
  });

  const close = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    setClosing(true);
    timer.current = window.setTimeout(() => latestOnClose.current(), CLOSE_MS);
  }, []);

  // If the parent removes the modal some other way, the pending timer must not fire later.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    // Every open modal takes part in the stack, even one that ignores Escape:
    // otherwise Escape would close the modal underneath it.
    const id = Symbol("modal");
    openModals.push(id);
    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape" && openModals[openModals.length - 1] === id) close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openModals.splice(openModals.indexOf(id), 1);
    };
  }, [close, closeOnEscape]);

  return { closing, close };
}
