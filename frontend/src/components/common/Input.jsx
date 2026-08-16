import { useId } from "react";

export default function Input({
  label,
  error,
  hint,
  type = "text",
  className = "",
  ...props
}) {
  const id = useId();

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}

      <input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 ${
          error
            ? "border-brick focus:border-brick focus:ring-brick"
            : "border-hairline focus:border-teal focus:ring-teal"
        }`}
        {...props}
      />

      {error ? (
        <p id={`${id}-error`} className="text-xs text-brick">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
