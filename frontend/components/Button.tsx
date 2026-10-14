import type { ButtonHTMLAttributes } from "react";

// Brand rule: one "primary" per view; everything else secondary, ghost or icon.
// Each variant sets its own colours (two classes for the same property would fight).
const VARIANTS = {
  primary: "px-4 border-transparent bg-brand text-on-brand hover:bg-brand-strong",
  secondary: "px-4 border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken",
  ghost: "px-4 border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
  icon: "w-9 justify-center border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS };

export function Button({ variant = "secondary", className = "", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border text-[13px] leading-[18px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
