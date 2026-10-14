import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

// Top bar: the logo on the left, the page's main action on the right.
export function Header({ action }: { action?: ReactNode }) {
  return (
    <header className="border-b border-line bg-surface-raised">
      <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between gap-4 px-6">
        <Logo />
        {action}
      </div>
    </header>
  );
}
