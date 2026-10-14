"use client";

import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";

type Props = {
  labelledBy: string; // id of the element that names the dialog (its title)
  onClose: () => void;
  children: ReactNode;
};

// A modal built on the browser's own <dialog> element. showModal() gives us,
// for free: the dimmed backdrop, focus kept inside the dialog, Esc to close,
// and focus returned to the button that opened it when it closes.
//
// The parent mounts this component to open it and unmounts it in onClose.
// Every way of closing (Esc, backdrop click, closeParentDialog) goes through
// the native close, which fires onClose and returns focus.
export function Dialog({ labelledBy, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    // Start on the field marked data-autofocus, if any (e.g. the name in "Add lead").
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      // A press on the <dialog> element itself (not its content) is on the backdrop.
      // mousedown, not click: a text selection that starts inside and ends on the
      // backdrop must not close the dialog and lose what was typed.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="dialog-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[640px] overflow-hidden rounded-lg border border-line bg-surface-raised p-0 text-ink shadow-dialog backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">{children}</div>
    </dialog>
  );
}

// For Close / Cancel buttons inside a dialog: close it the native way.
export function closeParentDialog(e: MouseEvent<HTMLElement>) {
  e.currentTarget.closest("dialog")?.close();
}
