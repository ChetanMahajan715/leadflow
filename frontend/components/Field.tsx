import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
};

// Label above, input, then the error (if any). Required fields show a red
// asterisk AND the word "required" for screen readers; optional ones say "(optional)".
export function Field({ id, label, required, error, ...inputProps }: Props) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] leading-[18px] font-semibold text-ink">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="ml-1 font-medium text-ink-muted">(optional)</span>
        )}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="h-10 rounded-sm border border-line-strong bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
